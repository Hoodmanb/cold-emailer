/* ============================================================
   PAMILERIN CV - RENDER ENGINE

   Maps cvData to DOM elements. Each section type has its own
   render function. Add new section types by extending the
   renderSection() switch statement.
   ============================================================ */

(function () {
    "use strict";

    // ── RENDER: HEADER ────────────────────────────────────────
    function renderHeader(data) {
        const container = document.getElementById("cv-header");
        if (!container || !data) return;

        const nameEl = document.createElement("h1");
        nameEl.className = "cv-header__name";
        nameEl.textContent = data.name;
        container.appendChild(nameEl);

        const contactEl = document.createElement("div");
        contactEl.className = "cv-header__contact";

        data.contact.forEach((item, index) => {
            const span = document.createElement("span");
            span.className = "cv-header__contact-item";
            span.textContent = item.value;
            contactEl.appendChild(span);

            if (index < data.contact.length - 1) {
                const sep = document.createElement("span");
                sep.className = "cv-header__contact-separator";
                sep.textContent = " | ";
                contactEl.appendChild(sep);
            }
        });

        container.appendChild(contactEl);
    }

    // ── RENDER: SECTION TITLE ───────────────────────────────
    function renderSectionTitle(titleText) {
        const h2 = document.createElement("h2");
        h2.className = "cv-section__title";
        h2.textContent = titleText;
        return h2;
    }

    // ── RENDER: EXPERIENCE ITEM ─────────────────────────────
    function renderExperienceItem(item) {
        const div = document.createElement("div");
        div.className = "cv-item page-break-inside-avoid";

        // Header
        const header = document.createElement("div");
        header.className = "cv-item__header";

        const titleWrap = document.createElement("div");
        const title = document.createElement("span");
        title.className = "cv-item__title";
        title.textContent = item.title;
        titleWrap.appendChild(title);

        if (item.subtitle) {
            const sub = document.createElement("span");
            sub.className = "cv-item__subtitle";
            sub.textContent = ` (${item.subtitle})`;
            titleWrap.appendChild(sub);
        }

        const meta = document.createElement("div");
        meta.className = "cv-item__meta";
        const loc = document.createElement("span");
        loc.className = "cv-item__location";
        loc.textContent = item.location;
        const date = document.createElement("span");
        date.className = "cv-item__date";
        date.textContent = item.dateRange;
        meta.appendChild(loc);
        meta.appendChild(document.createTextNode(" "));
        meta.appendChild(date);

        header.appendChild(titleWrap);
        header.appendChild(meta);
        div.appendChild(header);

        // Responsibilities
        if (item.responsibilities && item.responsibilities.length > 0) {
            const label = document.createElement("div");
            label.className = "cv-item__label";
            label.textContent = "Responsibilities";
            div.appendChild(label);

            const ul = document.createElement("ul");
            ul.className = "cv-item__list";
            item.responsibilities.forEach(resp => {
                const li = document.createElement("li");
                li.className = "cv-item__list-item";
                li.textContent = resp;
                ul.appendChild(li);
            });
            div.appendChild(ul);
        }

        return div;
    }

    // ── RENDER: EDUCATION ITEM ──────────────────────────────
    function renderEducationItem(item) {
        const div = document.createElement("div");
        div.className = "cv-item page-break-inside-avoid";

        const header = document.createElement("div");
        header.className = "cv-item__header";

        const titleWrap = document.createElement("div");
        const title = document.createElement("span");
        title.className = "cv-item__title";
        title.textContent = `${item.degree} – ${item.field}`;
        titleWrap.appendChild(title);

        const meta = document.createElement("div");
        meta.className = "cv-item__meta";
        const inst = document.createElement("span");
        inst.className = "cv-item__location";
        inst.textContent = item.institution;
        const date = document.createElement("span");
        date.className = "cv-item__date";
        date.textContent = item.dateRange;
        meta.appendChild(inst);
        meta.appendChild(document.createTextNode(" "));
        meta.appendChild(date);

        header.appendChild(titleWrap);
        header.appendChild(meta);
        div.appendChild(header);

        return div;
    }

    // ── RENDER: SKILLS SECTION ────────────────────────────────
    function renderSkillsSection(section, container) {
        container.appendChild(renderSectionTitle(section.title));

        const grid = document.createElement("div");
        grid.className = "cv-skills-grid";

        section.columns.forEach(col => {
            const ul = document.createElement("ul");
            ul.className = "cv-skills__column";
            col.forEach(skill => {
                const li = document.createElement("li");
                li.className = "cv-skills__item";
                li.textContent = skill;
                ul.appendChild(li);
            });
            grid.appendChild(ul);
        });

        container.appendChild(grid);
    }

    // ── RENDER: COMPETENCE SECTION ────────────────────────────
    function renderCompetenceSection(section, container) {
        container.appendChild(renderSectionTitle(section.title));

        const grid = document.createElement("div");
        grid.className = "cv-competence-grid";

        section.columns.forEach(col => {
            const ul = document.createElement("ul");
            ul.className = "cv-competence__column";
            col.forEach(comp => {
                const li = document.createElement("li");
                li.className = "cv-competence__item";
                li.textContent = comp;
                ul.appendChild(li);
            });
            grid.appendChild(ul);
        });

        container.appendChild(grid);
    }

    // ── RENDER: CERTIFICATIONS SECTION ────────────────────────
    function renderCertificationsSection(section, container) {
        container.appendChild(renderSectionTitle(section.title));

        const ul = document.createElement("ul");
        ul.className = "cv-cert-list";
        section.items.forEach(cert => {
            const li = document.createElement("li");
            li.className = "cv-cert-item";
            li.textContent = cert;
            ul.appendChild(li);
        });

        container.appendChild(ul);
    }

    // ── RENDER: REFERENCES SECTION ──────────────────────────
    function renderReferencesSection(section, container) {
        container.appendChild(renderSectionTitle(section.title));

        const p = document.createElement("p");
        p.className = "cv-references__text";
        p.textContent = section.text;
        container.appendChild(p);
    }

    // ── RENDER: SUMMARY SECTION ───────────────────────────────
    function renderSummarySection(section, container) {
        container.appendChild(renderSectionTitle(section.title));

        const p = document.createElement("p");
        p.className = "cv-item__text";
        p.textContent = section.content;
        container.appendChild(p);
    }

    // ── RENDER: RESEARCH SECTION ──────────────────────────────
    function renderResearchSection(section, container) {
        container.appendChild(renderSectionTitle(section.title));

        const p = document.createElement("p");
        p.className = "cv-item__text";
        p.textContent = section.content;
        container.appendChild(p);
    }

    // ── RENDER: EXPERIENCE SECTION ────────────────────────────
    function renderExperienceSection(section, container) {
        container.appendChild(renderSectionTitle(section.title));

        const content = document.createElement("div");
        content.className = "cv-section__content";
        section.items.forEach(item => {
            content.appendChild(renderExperienceItem(item));
        });
        container.appendChild(content);
    }

    // ── RENDER: EDUCATION SECTION ─────────────────────────────
    function renderEducationSection(section, container) {
        container.appendChild(renderSectionTitle(section.title));

        const content = document.createElement("div");
        content.className = "cv-section__content";
        section.items.forEach(item => {
            content.appendChild(renderEducationItem(item));
        });
        container.appendChild(content);
    }

    // ── MAIN: RENDER SECTION ──────────────────────────────────
    function renderSection(section) {
        const container = document.getElementById(`cv-${section.id}`);
        if (!container) return;

        // Clear existing content
        container.innerHTML = "";

        switch (section.type) {
            case "summary":
                renderSummarySection(section, container);
                break;
            case "experience":
                renderExperienceSection(section, container);
                break;
            case "skills":
                renderSkillsSection(section, container);
                break;
            case "education":
                renderEducationSection(section, container);
                break;
            case "certifications":
                renderCertificationsSection(section, container);
                break;
            case "research":
                renderResearchSection(section, container);
                break;
            case "competence":
                renderCompetenceSection(section, container);
                break;
            case "references":
                renderReferencesSection(section, container);
                break;
            default:
                console.warn(`Unknown section type: ${section.type}`);
        }
    }

    // ── INIT ──────────────────────────────────────────────────
    function init() {
        if (typeof cvData === "undefined") {
            console.error("cvData not found. Make sure data.js is loaded before render.js.");
            return;
        }

        // Render header
        renderHeader(cvData.header);

        // Render each section
        cvData.sections.forEach(section => {
            renderSection(section);
        });
    }

    // Run when DOM is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})();