/**
 * ================================================
 * CV RENDERING ENGINE
 * ================================================
 * 
 * This script:
 * 1. Reads from cvData object (data.js)
 * 2. Dynamically populates all HTML elements
 * 3. Works in both browser and Puppeteer contexts
 * 4. Optimized for A4 PDF generation
 */

class CVRenderer {
    constructor(data) {
        this.data = data;
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.render());
        } else {
            this.render();
        }
    }

    render() {
        try {
            this.renderHeader();
            this.renderSummary();
            this.renderAchievements();
            this.renderLeadership();
            this.renderWorkHistory();
            this.renderEducation();
            this.renderCertifications();
            this.renderResearch();
            this.renderSkills();
            this.renderMscModules();
            this.renderCompetencies();
            this.renderReferences();
            console.log('CV rendering complete');
        } catch (error) {
            console.error('Error rendering CV:', error);
        }
    }

    /**
     * HEADER RENDERING
     * Updates name, title, and contact information
     */
    renderHeader() {
        const { name, title, contact } = this.data.header;

        document.querySelector('.header-name').textContent = name;
        document.querySelector('.header-title').textContent = title;

        const contactItems = document.querySelectorAll('.contact-item');
        const contactData = [
            { label: 'Phone:', value: contact.phone },
            { label: 'Email:', value: contact.email },
            { label: 'Location:', value: contact.location }
        ];

        contactItems.forEach((item, index) => {
            if (contactData[index]) {
                item.querySelector('.contact-label').textContent = contactData[index].label;

                const valueEl = item.querySelector('.contact-value');

                if (contactData[index].label === 'Email:') {
                    valueEl.textContent = contactData[index].value;
                    valueEl.setAttribute('href', `mailto:${contactData[index].value}`);
                } else {
                    valueEl.textContent = contactData[index].value;
                }
            }
        });
    }

    /**
     * PROFESSIONAL SUMMARY RENDERING
     */
    renderSummary() {
        const summaryText = document.querySelector('.summary-text');
        if (summaryText) {
            summaryText.textContent = this.data.summary.content;
        }
    }

    /**
    * Achievement
    */
    renderAchievements() {
        const container = document.getElementById('achievementsContainer');
        if (!container) return;

        container.innerHTML = this.data.achievements.map(item => `
        <div class="responsibility-item">
            ${this.escapeHtml(item)}
        </div>
    `).join('');
    }

    /**
    * LEADERSHIP
    */
    renderLeadership() {
        const container = document.getElementById('leadershipContainer');
        if (!container) return;

        container.innerHTML = this.data.leadership.map(item => `
        <div class="responsibility-item">
            ${this.escapeHtml(item)}
        </div>
    `).join('');
    }

    /**
     * WORK HISTORY RENDERING
     * Dynamically creates job entry components
     */
    renderWorkHistory() {
        const container = document.getElementById('workHistoryContainer');
        if (!container) return;

        container.innerHTML = this.data.workHistory.map(job => `
            <div class="job-entry">
                <div class="job-header">
                    <div>
                        <div class="job-title">${this.escapeHtml(job.jobTitle)}</div>
                        <div class="job-company">${this.escapeHtml(job.company)}</div>
                    </div>
                </div>
                <div class="job-meta">
                    <span class="job-date-range">${this.escapeHtml(job.dateRange)}</span>
                    <span class="job-location">${this.escapeHtml(job.location)}</span>
                </div>
                <div class="job-responsibilities">
                    ${job.responsibilities.map(resp => `
                        <div class="responsibility-item">${this.escapeHtml(resp)}</div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    /**
     * EDUCATION RENDERING
     * Dynamically creates education entry components
     */
    renderEducation() {
        const container = document.getElementById('educationContainer');
        if (!container) return;

        container.innerHTML = this.data.education.map(edu => `
            <div class="education-entry">
                <div class="education-degree">${this.escapeHtml(edu.degree)}</div>
                <div class="education-field">${this.escapeHtml(edu.field)}</div>
                <div class="education-school">${this.escapeHtml(edu.institution)}</div>
                <div class="education-meta">
                    <span>${this.escapeHtml(edu.dateRange)}</span>
                </div>
            </div>
        `).join('');
    }

    /**
    * MSc Modules
    */
    renderMscModules() {
        const container = document.getElementById('mscModulesContainer');
        if (!container) return;

        container.innerHTML = this.data.mscModules.map(item => `
        <div class="responsibility-item">
            ${this.escapeHtml(item)}
        </div>
    `).join('');
    }

    /**
     * CERTIFICATIONS RENDERING
     * Dynamically creates certification entry components
     */
    renderCertifications() {
        const container = document.getElementById('certificationsContainer');
        if (!container) return;

        container.innerHTML = this.data.certifications.map(cert => `
            <div class="certification-item">
                <div class="certification-title">${this.escapeHtml(cert.title)}</div>
                <div class="certification-details">${this.escapeHtml(cert.details)}</div>
            </div>
        `).join('');
    }

    /**
     * RESEARCH & PUBLICATIONS RENDERING
     */
    renderResearch() {
        const container = document.getElementById('researchContainer');
        if (!container) return;

        if (this.data.research && this.data.research.length > 0) {
            container.innerHTML = this.data.research.map(item => `
                <div class="research-item">
                    <div class="research-title">${this.escapeHtml(item.title)}</div>
                    <div class="research-details">${this.escapeHtml(item.details)}</div>
                </div>
            `).join('');
        }
    }

    /**
     * SKILLS RENDERING
     * Two-column layout with skill categories
     */
    renderSkills() {
        const container = document.getElementById('skillsContainer');
        if (!container) return;

        if (this.data.skills && this.data.skills.length > 0) {
            container.innerHTML = `
                <div class="skills-list">
                    ${this.data.skills.map(skillCategory => `
                        <div class="skill-category">
                            <div class="skill-category-title">${this.escapeHtml(skillCategory.category)}</div>
                            <div class="skill-items">
                                ${skillCategory.items.map(skill => `
                                    <div class="skill-item">${this.escapeHtml(skill)}</div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    /**
     * CORE COMPETENCIES RENDERING
     * Three-column badge layout
     */
    renderCompetencies() {
        const container = document.getElementById('competenciesContainer');
        if (!container) return;

        if (this.data.competencies && this.data.competencies.length > 0) {
            container.innerHTML = `
                <div class="competencies-grid">
                    ${this.data.competencies.map(competency => `
                        <div class="competency-badge">${this.escapeHtml(competency)}</div>
                    `).join('')}
                </div>
            `;
        }
    }

    /**
     * REFERENCES RENDERING
     */
    renderReferences() {
        const referencesText = document.querySelector('.references-text');
        if (referencesText) {
            referencesText.textContent = this.data.references;
        }
    }

    /**
     * UTILITY: Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (text === null || text === undefined) return '';

        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };

        return String(text).replace(/[&<>"']/g, m => map[m]);
    }
}

// ============ INITIALIZATION ============
// Automatically initialize renderer when data is available
if (typeof cvData !== 'undefined') {
    const renderer = new CVRenderer(cvData);
}
