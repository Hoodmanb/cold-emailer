/* ============================================================
   PAMILERIN CV - DATA OBJECT

   All content is defined here. To update the CV, simply
   modify the values below. No need to touch HTML or CSS.

   Structure:
   - header: Name + contact info
   - sections[]: Array of section objects, each with a type
   ============================================================ */

const cvData = {

    // ── HEADER ────────────────────────────────────────────────
    header: {
        name: "Pamilerin Fayose",
        contact: [
            { type: "address", value: "19 Claremont Avenue, Leeds, West Yorkshire, LS3 1AT" },
            { type: "phone", value: "+44 7350 168 547" },
            { type: "email", value: "fpamilerinadeniyi@gmail.com" }
        ]
    },

    // ── SECTIONS ────────────────────────────────────────────
    sections: [

        // ── PROFESSIONAL SUMMARY ───────────────────────────────
        {
            id: "summary",
            type: "summary",
            title: "Professional Summary",
            content: "Enthusiastic individual dedicated to delivering high-quality support and building strong professional relationships. Experienced across hospitality, sales, logistics, and business operations, with excellent communication, organisational, and problem-solving skills developed in fast-paced environments. Confident working both independently and within teams, with a proactive and adaptable approach to managing responsibilities and delivering excellent service."
        },

        // ── WORK HISTORY ───────────────────────────────────────
        {
            id: "work",
            type: "experience",
            title: "Work History",
            items: [
                {
                    title: "Holiday Inn Express",
                    subtitle: "Room Attendant",
                    location: "Leeds, West Berkshire",
                    dateRange: "Feb 2026 – May 2026",
                    responsibilities: [
                        "Communicated professionally with supervisors and team members to ensure smooth operations.",
                        "Managed workload efficiently to meet daily deadlines and operational targets.",
                        "Contributed to positive guest experiences through high quality service."
                    ]
                },
                {
                    title: "The Three Tuns",
                    subtitle: "Cleaner",
                    location: "York, North Yorkshire",
                    dateRange: "Sep 2025 – Feb 2026",
                    responsibilities: [
                        "Maintained cleanliness and hygiene standards across customer and staff areas.",
                        "Demonstrated reliability, punctuality and a strong work ethic while balancing academic studies.",
                        "Executed strong attention to details and organizational skills.",
                        "Worked independently to support daily pub operations."
                    ]
                },
                {
                    title: "Daily Deal Arrivals",
                    subtitle: "Manager",
                    location: "Ibadan, Oyo",
                    dateRange: "Mar 2023 – Jul 2025",
                    responsibilities: [
                        "Built and maintained professional relationships with clients and business partners.",
                        "Oversaw administrative tasks, record management and operational planning.",
                        "Developed strong leadership, organizational and problem solving skills.",
                        "Applied entrepreneurial initiative and commercial awareness."
                    ]
                },
                {
                    title: "Daily Deal Autos",
                    subtitle: "Car Sales Executive",
                    location: "Lagos, Nigeria",
                    dateRange: "May 2021 – Jan 2025",
                    responsibilities: [
                        "Took initiative in leading a small project/team.",
                        "Assisted customers with vehicle enquiries and sales process.",
                        "Developed creative solutions to improve customer satisfaction.",
                        "Managed vehicle delivery and logistics operations.",
                        "Maintained knowledge of vehicle conditions and market trends."
                    ]
                }
            ]
        },

        // ── SKILLS ─────────────────────────────────────────────
        {
            id: "skills",
            type: "skills",
            title: "Skills",
            columns: [
                [
                    "Teamwork & Collaboration",
                    "Customer Services",
                    "Problem Solving & Initiative",
                    "Professional Communication",
                    "Microsoft Office (Word, Excel, PowerPoint)"
                ],
                [
                    "Time Management",
                    "Organizational & Research Skills",
                    "Report Writing & Data Analysis",
                    "Attention to Details & Reliability",
                    "Understanding of Human Behaviour"
                ]
            ]
        },

        // ── EDUCATION ──────────────────────────────────────────
        {
            id: "education",
            type: "education",
            title: "Education",
            items: [
                {
                    degree: "Master of Science",
                    field: "Human Resources Management",
                    institution: "York St John University, York",
                    dateRange: "Sep 2025 – Current"
                },
                {
                    degree: "Bachelor of Science",
                    field: "Human Resources Management",
                    institution: "Ekiti State University, Nigeria",
                    dateRange: "Jun 2018 – Mar 2024"
                }
            ]
        },

        // ── CERTIFICATIONS ─────────────────────────────────────
        {
            id: "certifications",
            type: "certifications",
            title: "Certification / Entrepreneurship",
            items: [
                "Trade Test Certificate Grade 1, 2 and 3 (Motor Vehicle Mechanic Work – Confirmation of Competence) – Skills Development and Certification Department, Federal Ministry of Labor and Productivity, Nigeria (2020)",
                "Trademark Registration Certificate (DDA Daily Deal Autos) – Nigeria (2022)",
                "Business Registration Certificate (DDA Daily Deals Autos) – Nigeria (2022)"
            ]
        },

        // ── RESEARCH & PUBLICATIONS ────────────────────────────
        {
            id: "research",
            type: "research",
            title: "Research & Publications",
            content: "Published undergraduate research project in 2024 on (Attitude Towards Money and Tolerance for Ambiguity as Predictors of Entrepreneurial Passion: A study Among Entrepreneurs in Ado Ekiti Metropolis) in journal, demonstrating research, analytical and report writing skills."
        },

        // ── CORE COMPETENCE ────────────────────────────────────
        {
            id: "competence",
            type: "competence",
            title: "Core Competence",
            columns: [
                [
                    "Emotional Intelligence",
                    "Customer Service",
                    "Employee Support",
                    "Innovative Thinking",
                    "Workload Prioritization"
                ],
                [
                    "Team Collaboration",
                    "Multitasking & Time Management",
                    "Communication & Interpersonal Skills",
                    "Leadership & Business Operations"
                ]
            ]
        },

        // ── REFERENCES ─────────────────────────────────────────
        {
            id: "references",
            type: "references",
            title: "References",
            text: "Available on request"
        }

    ]
};