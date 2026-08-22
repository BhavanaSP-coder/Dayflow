/* Dayflow HRMS - sign-up form helpers.
 *
 * Plain browser script (no Odoo module) so it also runs on the standalone
 * auth pages: live password strength meter and confirmation matching.
 * The server re-validates everything in _dayflow_validate_signup().
 */
(function () {
    "use strict";

    var RULES = {
        length: function (value) { return value.length >= 8; },
        upper: function (value) { return /[A-Z]/.test(value); },
        lower: function (value) { return /[a-z]/.test(value); },
        digit: function (value) { return /[0-9]/.test(value); },
        special: function (value) { return /[^A-Za-z0-9]/.test(value); },
    };

    var LEVELS = [
        { cls: "is-weak", label: "Weak" },
        { cls: "is-weak", label: "Weak" },
        { cls: "is-fair", label: "Fair" },
        { cls: "is-good", label: "Good" },
        { cls: "is-strong", label: "Strong" },
    ];

    function setRuleState(list, name, met) {
        if (!list) {
            return;
        }
        var item = list.querySelector('[data-rule="' + name + '"]');
        if (!item) {
            return;
        }
        item.classList.toggle("is-met", met);
        var icon = item.querySelector("i");
        if (icon) {
            icon.className = met ? "fa fa-check-circle" : "fa fa-circle-o";
        }
    }

    function updateStrength(password, meter, rulesList) {
        var passed = 0;
        Object.keys(RULES).forEach(function (name) {
            var met = RULES[name](password);
            if (met) {
                passed += 1;
            }
            setRuleState(rulesList, name, met);
        });

        if (!meter) {
            return;
        }
        meter.classList.remove("is-weak", "is-fair", "is-good", "is-strong");
        var label = meter.querySelector(".o_dayflow_strength_label");
        if (!password) {
            if (label) {
                label.textContent = "Enter a password";
            }
            return;
        }
        // 5 rules -> 5 buckets, clamped to the LEVELS table.
        var level = LEVELS[Math.max(0, Math.min(passed - 1, LEVELS.length - 1))];
        meter.classList.add(level.cls);
        if (label) {
            label.textContent = level.label;
        }
    }

    function updateMatch(password, confirm, hint) {
        if (!hint) {
            return;
        }
        hint.classList.remove("is-ok", "is-ko");
        if (!confirm) {
            hint.textContent = "";
            return;
        }
        var same = password === confirm;
        hint.textContent = same ? "Passwords match" : "Passwords do not match yet";
        hint.classList.add(same ? "is-ok" : "is-ko");
    }

    function init() {
        var passwordInput = document.querySelector("[data-dayflow-password]");
        if (!passwordInput) {
            return;
        }
        var confirmInput = document.querySelector("[data-dayflow-confirm]");
        var meter = document.querySelector("[data-dayflow-strength]");
        var rulesList = document.querySelector("[data-dayflow-rules]");
        var matchHint = document.querySelector("[data-dayflow-match]");

        function refresh() {
            var password = passwordInput.value || "";
            updateStrength(password, meter, rulesList);
            updateMatch(password, confirmInput ? confirmInput.value : "", matchHint);
        }

        passwordInput.addEventListener("input", refresh);
        if (confirmInput) {
            confirmInput.addEventListener("input", refresh);
        }
        refresh();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
