/**
 * Ripple class to create ripple effects on elements.
 * Made by RealMrHex
 */
export class Ripple {
    /**
     * Constructs a Ripple instance.
     *
     * @param {string} selector - The CSS selector for target elements.
     * @param {Object} options - Configuration options for the ripple effect.
     */
    constructor(selector, options) {
        this.selector = selector;
        this.defaults = {
            debug: false,
            on: 'mousedown',
            opacity: 0.5,
            color: "auto",
            multi: false,
            duration: 0.7,
            rate: pxPerSecond => pxPerSecond,
            easing: 'linear',
            ...options
        };

        // Adds event listener to the document for the specified trigger event.
        document.addEventListener(this.defaults.on, event => {
            // Check if the event's target matches the specified selector.
            if (!event.target.matches(this.selector)) {
                return;
            }
            this.trigger(event);
        });
    }

    /**
     * Logs messages to the console if debugging is enabled.
     *
     * @param  {...any} args - Messages or objects to log.
     */
    log(...args) {
        if (this.defaults.debug && console && console.log) {
            console.log(...args);
        }
    }

    /**
     * Triggers the ripple effect.
     *
     * @param {Event} e - The event object.
     */
    trigger(e) {
        const $this = e.target;
        const settings = {...this.defaults, ...$this.dataset};

        // Overrides settings with data attributes if present.
        settings.debug = $this.hasAttribute('panic-ripple-debug') ? $this.getAttribute('panic-ripple-debug') === 'true' : settings.debug;
        settings.opacity = $this.getAttribute('panic-ripple-opacity') ? parseFloat($this.getAttribute('panic-ripple-opacity')) : settings.opacity;
        settings.color = $this.getAttribute('panic-ripple-color') || settings.color;
        settings.multi = $this.hasAttribute('panic-ripple-multi') ? $this.getAttribute('panic-ripple-multi') === 'true' : settings.multi;
        settings.duration = $this.getAttribute('panic-ripple-duration') ? parseFloat($this.getAttribute('panic-ripple-duration')) : settings.duration;
        settings.easing = $this.getAttribute('panic-ripple-easing') || settings.easing;

        $this.classList.add('has-ripple');

        // Create ripple element if necessary.
        let $ripple = settings.multi ? null : $this.querySelector(".ripple");

        if (settings.multi || !$ripple) {
            $ripple = document.createElement("span");
            $ripple.className = "ripple";
            $this.appendChild($ripple);
            this.log('Create: Ripple');

            // Set size of the ripple.
            if (!$ripple.offsetHeight && !$ripple.offsetWidth) {
                const size = Math.max($this.offsetWidth, $this.offsetHeight);
                Object.assign($ripple.style, {
                    height: `${size}px`,
                    width: `${size}px`
                });
                this.log('Set: Ripple size');
            }

            // Adjust the duration based on the rate function.
            if (settings.rate && typeof settings.rate === "function") {
                const rate = Math.round($ripple.offsetWidth / settings.duration);
                const filteredRate = settings.rate(rate);
                const newDuration = $ripple.offsetWidth / filteredRate;

                if (settings.duration.toFixed(2) !== newDuration.toFixed(2)) {
                    this.log('Update: Ripple Duration', {
                        from: settings.duration,
                        to: newDuration
                    });
                    settings.duration = newDuration;
                }
            }

            // Set the color, duration, easing, and opacity of the ripple.
            const color = settings.color === "auto" ? getComputedStyle($this).color : settings.color;
            Object.assign($ripple.style, {
                animationDuration: `${settings.duration}s`,
                animationTimingFunction: settings.easing,
                background: color,
                opacity: settings.opacity
            });

            this.log('Set: Ripple CSS', $ripple.style);
        }

        // Handle non-multi ripple scenario.
        if (!settings.multi) {
            this.log('Set: Ripple Element');
            $ripple = $this.querySelector(".ripple");
        }

        this.log('Destroy: Ripple Animation');
        $ripple.classList.remove("ripple-animate");

        // Calculate the position of the ripple.
        const rect = $this.getBoundingClientRect();

        const x = e.clientX - rect.left - $ripple.offsetWidth / 2;
        const y = e.clientY - rect.top - $ripple.offsetHeight / 2;

        // Remove the ripple after animation ends (if multi ripple is enabled).
        if (settings.multi) {
            this.log('Set: Ripple animationend event');
            let that = this;
            $ripple.addEventListener('animationend', function () {
                that.log('Note: Ripple animation ended');
                that.log('Destroy: Ripple');
                this.remove();
            }, {once: true});
        }

        // Set the position and start the animation.
        this.log('Set: Ripple location');
        this.log('Set: Ripple animation');
        Object.assign($ripple.style, {
            top: `${y}px`,
            left: `${x}px`
        });
        $ripple.classList.add("ripple-animate");
    }
}