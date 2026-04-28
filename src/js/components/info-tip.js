(function () {
    var counter = 0;

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function createButton(options) {
        var title = options && options.title ? options.title : 'Info';
        var content = options && options.content ? options.content : '';
        var trigger = options && options.trigger ? options.trigger : 'hover focus click';
        counter += 1;

        return [
            '<button type="button"',
            ' class="info-tip-btn text-textSecondary hover:text-accent transition-colors ml-1"',
            ' data-bs-toggle="popover"',
            ' data-bs-trigger="' + escapeHtml(trigger) + '"',
            ' data-bs-placement="top"',
            ' data-bs-title="' + escapeHtml(title) + '"',
            ' data-bs-content="' + escapeHtml(content) + '"',
            ' aria-label="Mas informacion de ' + escapeHtml(title) + '"',
            ' id="info-tip-' + counter + '">',
            '<i class="fa-solid fa-circle-info text-xs"></i>',
            '</button>'
        ].join('');
    }

    function init(scope) {
        if (typeof bootstrap === 'undefined' || !bootstrap.Popover) {
            return;
        }

        var root = scope || document;
        var elements = root.querySelectorAll('[data-bs-toggle="popover"]');

        elements.forEach(function (el) {
            var existing = bootstrap.Popover.getInstance(el);
            if (existing) {
                existing.dispose();
            }

            new bootstrap.Popover(el, {
                container: 'body',
                html: false,
                sanitize: true
            });
        });
    }

    window.InfoTip = {
        createButton: createButton,
        init: init
    };
})();
