(() => {
    "use strict";

    // =========================================================
    // CONFIGURATION - Read from .env
    // =========================================================
    // Note: In production, these should be set via environment variables
    // For now, we'll use defaults or you can replace with your actual values
    const CONFIG = {
        // Mental Health Predictor API
        API_BASE: "https://ai-powered-mental-health-predictor.onrender.com",
        // GROQ API for chat/insights
        GROQ_API_KEY: "", // Add your GROQ API key here or from .env
        GROQ_API_URL: "https://api.groq.com/openai/v1/chat/completions",
        GROQ_MODEL: "mixtral-8x7b-32768",
    };

    // Try to load from .env (if running in Node/with bundler)
    // For browser, we'll use a fallback or you can set manually above
    if (typeof process !== 'undefined' && process.env) {
        CONFIG.API_BASE = process.env.API_BASE || CONFIG.API_BASE;
        CONFIG.GROQ_API_KEY = process.env.GROQ_API_KEY || CONFIG.GROQ_API_KEY;
    }

    // DOM Elements
    const form = document.getElementById("predict-form");
    const submitBtn = document.getElementById("submit-btn");
    const resetBtn = document.getElementById("reset-btn");
    const errorRetryBtn = document.getElementById("error-retry-btn");

    const stateIdle = document.getElementById("state-idle");
    const stateLoading = document.getElementById("state-loading");
    const stateResult = document.getElementById("state-result");
    const stateError = document.getElementById("state-error");

    const scoreNumberEl = document.getElementById("score-number");
    const scoreBandEl = document.getElementById("score-band");
    const scoreContextEl = document.getElementById("score-context");
    const gaugeFill = document.getElementById("gauge-fill");
    const errorLabelEl = document.getElementById("error-label");
    const errorCopyEl = document.getElementById("error-copy");
    const progressBar = document.getElementById("progress-bar");
    const factorsCanvas = document.getElementById("factors-chart");
    const chatContainer = document.getElementById("chat-container");
    const chatToggleBtn = document.getElementById("chat-toggle-btn");
    const chatCloseBtn = document.getElementById("chat-close-btn");
    const chatMessages = document.getElementById("chat-messages");
    const chatInput = document.getElementById("chat-input");
    const chatSendBtn = document.getElementById("chat-send-btn");
    const suggestionChips = document.querySelectorAll(".suggestion-chip");

    const GAUGE_ARC_LENGTH = 314;
    const hasGSAP = typeof window.gsap !== "undefined";
    const hasChart = typeof window.Chart !== "undefined";

    // Respect users who've asked for less motion
    const prefersReducedMotion = window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Store the latest payload and score for chat context
    let latestPayload = null;
    let latestScore = null;

    // =========================================================
    // Particles
    // =========================================================
    function createParticles() {
        const container = document.getElementById("particles");
        if (!container) return;
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement("div");
            particle.className = "particle";
            particle.style.left = Math.random() * 100 + "%";
            particle.style.width = (2 + Math.random() * 4) + "px";
            particle.style.height = particle.style.width;
            particle.style.animationDuration = (15 + Math.random() * 25) + "s";
            particle.style.animationDelay = (Math.random() * 20) + "s";
            particle.style.opacity = 0.2 + Math.random() * 0.3;
            container.appendChild(particle);
        }
    }
    createParticles();

    // =========================================================
    // Gauge Ticks
    // =========================================================
    function drawTicks() {
        document.querySelectorAll(".gauge-ticks").forEach((g) => {
            g.innerHTML = "";
            const cx = 120,
                cy = 140,
                rOuter = 100,
                rInner = 90;
            for (let i = 0; i <= 10; i += 2) {
                const angle = Math.PI - (i / 10) * Math.PI;
                const x1 = cx + rOuter * Math.cos(angle);
                const y1 = cy - rOuter * Math.sin(angle);
                const x2 = cx + rInner * Math.cos(angle);
                const y2 = cy - rInner * Math.sin(angle);
                const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                line.setAttribute("x1", x1.toFixed(1));
                line.setAttribute("y1", y1.toFixed(1));
                line.setAttribute("x2", x2.toFixed(1));
                line.setAttribute("y2", y2.toFixed(1));
                g.appendChild(line);
            }
        });
    }
    drawTicks();

    // =========================================================
    // GSAP — page load entrance
    // =========================================================
    function runIntroAnimation() {
        if (!hasGSAP || prefersReducedMotion) return;

        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        tl.from("#header-badge", { y: -16, opacity: 0, duration: 0.5 })
          .from("#header-title", { y: 24, opacity: 0, duration: 0.7 }, "-=0.25")
          .from("#header-subtitle", { y: 16, opacity: 0, duration: 0.6 }, "-=0.4")
          .from("#form-panel-el", { y: 28, opacity: 0, duration: 0.7 }, "-=0.3")
          .from("#result-panel-el", { y: 28, opacity: 0, duration: 0.7 }, "-=0.55")
          .from(".anim-group", {
              y: 18,
              opacity: 0,
              duration: 0.5,
              stagger: 0.12
          }, "-=0.35");
    }
    runIntroAnimation();

    // =========================================================
    // Segmented Control
    // =========================================================
    const segGroup = document.getElementById("stress_level_group");
    const stressHiddenInput = document.getElementById("stress_level");

    if (segGroup) {
        segGroup.querySelectorAll(".seg-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                segGroup.querySelectorAll(".seg-btn").forEach((b) => b.classList.remove("active"));
                btn.classList.add("active");
                stressHiddenInput.value = btn.dataset.value;
                clearFieldError(stressHiddenInput);

                if (hasGSAP && !prefersReducedMotion) {
                    gsap.fromTo(btn, { scale: 0.9 }, { scale: 1, duration: 0.3, ease: "back.out(3)" });
                }
            });
        });
    }

    // =========================================================
    // Field Helpers
    // =========================================================
    function fieldWrapper(input) {
        if (!input) return null;
        return input.closest(".field");
    }

    function setFieldError(input, message) {
        if (!input) return;
        const wrap = fieldWrapper(input);
        if (!wrap) return;
        wrap.classList.add("field-error");
        const msgEl = wrap.querySelector(".error-msg");
        if (msgEl) msgEl.textContent = message;

        if (hasGSAP && !prefersReducedMotion) {
            gsap.fromTo(wrap, { x: -6 }, { x: 0, duration: 0.35, ease: "elastic.out(1, 0.4)" });
        }
    }

    function clearFieldError(input) {
        if (!input) return;
        const wrap = fieldWrapper(input);
        if (!wrap) return;
        wrap.classList.remove("field-error");
        const msgEl = wrap.querySelector(".error-msg");
        if (msgEl) msgEl.textContent = "";
    }

    function clearAllErrors() {
        if (!form) return;
        form.querySelectorAll(".field").forEach((f) => f.classList.remove("field-error"));
        form.querySelectorAll(".error-msg").forEach((m) => (m.textContent = ""));
    }

    // =========================================================
    // Validation
    // =========================================================
    function validate(payload) {
        const errors = [];
        const numericChecks = [
            ["age", 10, 100],
            ["avg_daily_usage_hours", 0, 24],
            ["daily_unlocks", 0, Infinity],
            ["study_hours", 0, 24],
            ["physical_activity_hours", 0, 24],
            ["sleep_hours_per_night", 0, 24],
        ];

        numericChecks.forEach(([key, min, max]) => {
            const input = document.getElementById(key);
            const val = payload[key];
            if (val === "" || val === null || Number.isNaN(val)) {
                errors.push([input, "This field is required."]);
            } else if (val < min || val > max) {
                errors.push([input, `Must be between ${min} and ${max === Infinity ? "0+" : max}.`]);
            }
        });

        ["gender", "country", "academic_level", "most_used_platform", "purpose_of_use"].forEach((key) => {
            const input = document.getElementById(key);
            if (!payload[key] || String(payload[key]).trim() === "") {
                errors.push([input, "This field is required."]);
            }
        });

        if (!payload.stress_level) {
            errors.push([stressHiddenInput, "Please select a stress level."]);
        }

        return errors;
    }

    // =========================================================
    // Collect Payload
    // =========================================================
    function collectPayload() {
        const fd = new FormData(form);
        return {
            age: fd.get("age") === "" ? NaN : parseInt(fd.get("age"), 10),
            gender: fd.get("gender") || "",
            country: (fd.get("country") || "").trim(),
            academic_level: fd.get("academic_level") || "",
            most_used_platform: fd.get("most_used_platform") || "",
            purpose_of_use: fd.get("purpose_of_use") || "",
            avg_daily_usage_hours: fd.get("avg_daily_usage_hours") === "" ? NaN : parseFloat(fd.get("avg_daily_usage_hours")),
            daily_unlocks: fd.get("daily_unlocks") === "" ? NaN : parseInt(fd.get("daily_unlocks"), 10),
            study_hours: fd.get("study_hours") === "" ? NaN : parseFloat(fd.get("study_hours")),
            physical_activity_hours: fd.get("physical_activity_hours") === "" ? NaN : parseFloat(fd.get("physical_activity_hours")),
            sleep_hours_per_night: fd.get("sleep_hours_per_night") === "" ? NaN : parseFloat(fd.get("sleep_hours_per_night")),
            stress_level: fd.get("stress_level") || "",
        };
    }

    // =========================================================
    // UI State Management (crossfades handled by GSAP when available)
    // =========================================================
    function hideAllStatesInstant() {
        [stateIdle, stateLoading, stateResult, stateError].forEach(el => {
            if (el) el.classList.add("hidden");
        });
    }

    function showState(name) {
        const states = {
            idle: stateIdle,
            loading: stateLoading,
            result: stateResult,
            error: stateError
        };
        const target = states[name];
        if (!target) return;

        const current = [stateIdle, stateLoading, stateResult, stateError]
            .find(el => el && !el.classList.contains("hidden"));

        if (!hasGSAP || prefersReducedMotion) {
            hideAllStatesInstant();
            target.classList.remove("hidden");
            return;
        }

        const revealTarget = () => {
            hideAllStatesInstant();
            target.classList.remove("hidden");
            gsap.fromTo(target,
                { opacity: 0, y: 12 },
                { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }
            );
        };

        if (current && current !== target) {
            gsap.to(current, {
                opacity: 0,
                y: -8,
                duration: 0.2,
                ease: "power1.in",
                onComplete: revealTarget
            });
        } else {
            revealTarget();
        }
    }

    function setSubmitting(isSubmitting) {
        if (!submitBtn) return;
        submitBtn.disabled = isSubmitting;
        submitBtn.classList.toggle("loading", isSubmitting);
    }

    function bandFor(score) {
        if (score < 4) {
            return {
                label: "Strained",
                context: "Your patterns suggest significant strain. Consider prioritizing sleep, reducing screen time, and reaching out to someone you trust."
            };
        }
        if (score < 7) {
            return {
                label: "Balanced",
                context: "Your habits show a balanced baseline. Small improvements in sleep or stress management could boost your wellness further."
            };
        }
        return {
            label: "Strong",
            context: "Your habits point to a resilient, well-supported baseline. Keep up the great work maintaining these healthy patterns."
        };
    }

    // =========================================================
    // Factor breakdown chart (Chart.js radar)
    // =========================================================
    let factorsChartInstance = null;

    const STRESS_TO_SCORE = { "Low": 9, "Medium": 6, "High": 3.5, "Very High": 1.5 };

    function computeFactorScores(payload) {
        const sleep = clamp10(scaleTriangular(payload.sleep_hours_per_night, 0, 8, 10));
        const activity = clamp10((payload.physical_activity_hours / 2) * 10);
        const screenTimeHealth = clamp10(10 - (payload.avg_daily_usage_hours / 10) * 10);
        const unlocksHealth = clamp10(10 - (payload.daily_unlocks / 120) * 10);
        const stress = STRESS_TO_SCORE[payload.stress_level] ?? 5;

        return {
            "Sleep": round1(sleep),
            "Activity": round1(activity),
            "Screen Balance": round1(screenTimeHealth),
            "Unlock Discipline": round1(unlocksHealth),
            "Calm (Stress)": round1(stress),
        };
    }

    function clamp10(n) {
        if (Number.isNaN(n)) return 0;
        return Math.max(0, Math.min(10, n));
    }

    function round1(n) {
        return Math.round(n * 10) / 10;
    }

    function scaleTriangular(value, min, ideal, max) {
        if (Number.isNaN(value)) return 0;
        if (value <= min) return 0;
        if (value >= max) return 10 - Math.min(10, ((value - ideal) / (max - ideal)) * 4);
        if (value <= ideal) {
            return ((value - min) / (ideal - min)) * 10;
        }
        return 10 - ((value - ideal) / (max - ideal)) * 3;
    }

    function renderFactorsChart(payload) {
        if (!hasChart || !factorsCanvas) {
            console.warn("Chart.js not loaded or canvas missing");
            return;
        }

        const factors = computeFactorScores(payload);
        const labels = Object.keys(factors);
        const values = Object.values(factors);

        if (factorsChartInstance) {
            factorsChartInstance.destroy();
            factorsChartInstance = null;
        }

        const ctx = factorsCanvas.getContext("2d");
        
        // Ensure canvas has proper dimensions
        const parent = factorsCanvas.parentElement;
        if (parent) {
            const rect = parent.getBoundingClientRect();
            if (rect.width > 0) {
                factorsCanvas.width = rect.width * 0.9;
                factorsCanvas.height = rect.height * 0.9;
            }
        }

        factorsChartInstance = new Chart(ctx, {
            type: "radar",
            data: {
                labels: labels,
                datasets: [{
                    label: "Your profile",
                    data: values,
                    backgroundColor: "rgba(59, 130, 246, 0.22)",
                    borderColor: "#3b82f6",
                    borderWidth: 2,
                    pointBackgroundColor: "#3b82f6",
                    pointBorderColor: "#0a0e14",
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.15,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: prefersReducedMotion ? false : {
                    duration: 900,
                    easing: "easeOutQuart"
                },
                scales: {
                    r: {
                        min: 0,
                        max: 10,
                        ticks: {
                            display: false,
                            stepSize: 2
                        },
                        grid: { 
                            color: "rgba(255,255,255,0.08)" 
                        },
                        angleLines: { 
                            color: "rgba(255,255,255,0.08)" 
                        },
                        pointLabels: {
                            color: "#8899aa",
                            font: { 
                                size: 11, 
                                family: "Inter",
                                weight: "500"
                            }
                        }
                    }
                },
                plugins: {
                    legend: { 
                        display: false 
                    },
                    tooltip: {
                        backgroundColor: "#131a24",
                        borderColor: "rgba(255,255,255,0.1)",
                        borderWidth: 1,
                        titleColor: "#f0f4f8",
                        bodyColor: "#f0f4f8",
                        callbacks: {
                            label: (item) => ` ${item.label}: ${item.formattedValue}/10`
                        }
                    }
                }
            }
        });

        // Force a re-render after a small delay
        setTimeout(() => {
            if (factorsChartInstance) {
                factorsChartInstance.resize();
            }
        }, 100);

        // subtle entrance for the chart card itself
        if (hasGSAP && !prefersReducedMotion) {
            gsap.fromTo(".chart-card",
                { opacity: 0, y: 14 },
                { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", delay: 0.15 }
            );
        }
    }

    function renderResult(score, payload) {
        latestScore = score;
        latestPayload = payload;

        const clamped = Math.max(0, Math.min(10, score));
        const { label, context } = bandFor(clamped);

        if (scoreBandEl) scoreBandEl.textContent = label;
        if (scoreContextEl) scoreContextEl.textContent = context;

        // Animated count-up for the score number
        if (scoreNumberEl) {
            if (hasGSAP && !prefersReducedMotion) {
                const counter = { val: 0 };
                gsap.to(counter, {
                    val: score,
                    duration: 1.1,
                    ease: "power2.out",
                    onUpdate: () => { scoreNumberEl.textContent = counter.val.toFixed(2); }
                });
            } else {
                scoreNumberEl.textContent = score.toFixed(2);
            }
        }

        // Animated gauge sweep
        if (gaugeFill) {
            const offset = GAUGE_ARC_LENGTH * (1 - clamped / 10);
            if (hasGSAP && !prefersReducedMotion) {
                gsap.set(gaugeFill, { strokeDashoffset: GAUGE_ARC_LENGTH });
                gsap.to(gaugeFill, {
                    strokeDashoffset: offset,
                    duration: 1.3,
                    delay: 0.15,
                    ease: "power3.out"
                });
            } else {
                gaugeFill.style.transition = "none";
                gaugeFill.style.strokeDashoffset = String(GAUGE_ARC_LENGTH);
                requestAnimationFrame(() => {
                    gaugeFill.style.transition = "";
                    gaugeFill.style.strokeDashoffset = String(offset);
                });
            }
        }

        showState("result");
        renderFactorsChart(payload);
    }

    function renderError(label, copy) {
        if (errorLabelEl) errorLabelEl.textContent = label;
        if (errorCopyEl) errorCopyEl.textContent = copy;
        showState("error");

        if (hasGSAP && !prefersReducedMotion) {
            gsap.fromTo(".error-icon",
                { scale: 0.6, rotate: -8, opacity: 0 },
                { scale: 1, rotate: 0, opacity: 1, duration: 0.5, ease: "back.out(2.5)" }
            );
        }
    }

    // =========================================================
    // Apply Server Validation Errors
    // =========================================================
    function applyServerValidationErrors(detail) {
        if (!Array.isArray(detail)) return false;
        let matched = false;
        detail.forEach((err) => {
            const field = Array.isArray(err.loc) ? err.loc[err.loc.length - 1] : null;
            const input = field ? document.getElementById(field) : null;
            const target = field === "stress_level" ? stressHiddenInput : input;
            if (target) {
                setFieldError(target, err.msg || "Invalid value.");
                matched = true;
            }
        });
        return matched;
    }

    // =========================================================
    // GROQ API Integration for Chat
    // =========================================================
    async function getAIInsight(question) {
        if (!CONFIG.GROQ_API_KEY) {
            return "I'm sorry, the AI insights feature is not configured. Please add your GROQ API key.";
        }

        try {
            const response = await fetch(CONFIG.GROQ_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${CONFIG.GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: CONFIG.GROQ_MODEL,
                    messages: [
                        {
                            role: "system",
                            content: `You are a compassionate wellness coach. You have access to a user's mental health wellness score (${latestScore}/10) and their lifestyle factors. Provide helpful, actionable, and supportive insights about their wellness. Keep responses under 150 words and focus on practical advice.`
                        },
                        {
                            role: "user",
                            content: `My wellness score is ${latestScore}/10. Here are my factors: ${JSON.stringify(computeFactorScores(latestPayload))}. ${question}`
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 300,
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error?.message || `API responded with status ${response.status}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response at this time.";
        } catch (error) {
            console.error("GROQ API Error:", error);
            return "I'm having trouble connecting to the AI service. Please try again later.";
        }
    }

    // =========================================================
    // Chat UI Functions
    // =========================================================
    function addMessage(text, type) {
        const messageDiv = document.createElement("div");
        messageDiv.className = `chat-message ${type}`;
        messageDiv.innerHTML = `<div class="message-content">${text}</div>`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addTypingIndicator() {
        const messageDiv = document.createElement("div");
        messageDiv.className = "chat-message bot";
        messageDiv.id = "typing-indicator";
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="typing-indicator">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function removeTypingIndicator() {
        const indicator = document.getElementById("typing-indicator");
        if (indicator) indicator.remove();
    }

    async function handleChatSend() {
        const question = chatInput.value.trim();
        if (!question) return;

        // Disable input while processing
        chatInput.disabled = true;
        chatSendBtn.disabled = true;

        // Add user message
        addMessage(question, "user");
        chatInput.value = "";

        // Show typing indicator
        addTypingIndicator();

        try {
            const response = await getAIInsight(question);
            removeTypingIndicator();
            addMessage(response, "bot");
        } catch (error) {
            removeTypingIndicator();
            addMessage("I'm sorry, something went wrong. Please try again.", "bot");
        } finally {
            chatInput.disabled = false;
            chatSendBtn.disabled = false;
            chatInput.focus();
        }
    }

    // =========================================================
    // Event Listeners - Chat
    // =========================================================
    if (chatToggleBtn) {
        chatToggleBtn.addEventListener("click", () => {
            chatContainer.classList.toggle("hidden");
            if (!chatContainer.classList.contains("hidden")) {
                chatInput.focus();
                // Reset chat to initial state if no messages
                if (chatMessages.children.length === 0) {
                    addMessage("Hi! I can help you understand your wellness score better. Ask me anything about your results or get personalized recommendations.", "bot");
                }
            }
        });
    }

    if (chatCloseBtn) {
        chatCloseBtn.addEventListener("click", () => {
            chatContainer.classList.add("hidden");
        });
    }

    if (chatSendBtn) {
        chatSendBtn.addEventListener("click", handleChatSend);
    }

    if (chatInput) {
        chatInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                handleChatSend();
            }
        });
    }

    if (suggestionChips) {
        suggestionChips.forEach(chip => {
            chip.addEventListener("click", () => {
                chatInput.value = chip.dataset.question;
                handleChatSend();
            });
        });
    }

    // =========================================================
    // Form Submit
    // =========================================================
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            clearAllErrors();

            const payload = collectPayload();
            const clientErrors = validate(payload);

            if (clientErrors.length > 0) {
                clientErrors.forEach(([input, msg]) => input && setFieldError(input, msg));
                if (clientErrors[0][0]) clientErrors[0][0].focus();
                return;
            }

            setSubmitting(true);
            showState("loading");

            if (progressBar) {
                progressBar.style.animation = "none";
                progressBar.style.width = "0%";
                requestAnimationFrame(() => {
                    progressBar.style.animation = "progress-load 2s ease-in-out infinite";
                });
            }

            try {
                const res = await fetch(`${CONFIG.API_BASE}/predict`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                if (res.status === 422) {
                    const body = await res.json().catch(() => null);
                    const matched = body && applyServerValidationErrors(body.detail);
                    renderError(
                        "Check Your Inputs",
                        matched ?
                        "The API rejected some fields — details are marked on the form." :
                        "Please review your inputs and try again."
                    );
                    return;
                }

                if (!res.ok) {
                    let detailMsg = `The API responded with status ${res.status}.`;
                    const body = await res.json().catch(() => null);
                    if (body && typeof body.detail === "string") detailMsg = body.detail;
                    renderError("Prediction Failed", detailMsg);
                    return;
                }

                const data = await res.json();
                if (typeof data.predicted_mental_health_score !== "number") {
                    renderError("Unexpected Response", "The API responded but the score was missing.");
                    return;
                }

                renderResult(data.predicted_mental_health_score, payload);

            } catch (err) {
                renderError(
                    "Can't Reach Server",
                    `Couldn't connect to ${CONFIG.API_BASE}. Make sure the backend is running.`
                );
            } finally {
                setSubmitting(false);
            }
        });
    }

    // =========================================================
    // Live Error Clearing
    // =========================================================
    if (form) {
        form.querySelectorAll("input, select").forEach((el) => {
            el.addEventListener("input", () => clearFieldError(el));
            el.addEventListener("change", () => clearFieldError(el));
        });
    }
    
    // Reset Buttons
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            showState("idle");
            // Reset chat
            chatMessages.innerHTML = "";
            chatContainer.classList.add("hidden");
            latestPayload = null;
            latestScore = null;
        });
    }
    if (errorRetryBtn) {
        errorRetryBtn.addEventListener("click", () => {
            showState("idle");
        });
    }

    // Submit button micro-interaction
    if (submitBtn && hasGSAP && !prefersReducedMotion) {
        submitBtn.addEventListener("mouseenter", () => {
            gsap.to(submitBtn, { y: -2, duration: 0.2, ease: "power1.out" });
        });
        submitBtn.addEventListener("mouseleave", () => {
            gsap.to(submitBtn, { y: 0, duration: 0.2, ease: "power1.out" });
        });
    }

    // Check API Health
    async function checkApiHealth() {
        try {
            const response = await fetch(`${CONFIG.API_BASE}/health`);
            if (response.ok) {
                const data = await response.json();
                console.log("✅ API is healthy:", data);
                return true;
            }
        } catch (error) {
            console.warn("⚠️ API not reachable:", error.message);
            return false;
        }
        return false;
    }

    checkApiHealth();

})();