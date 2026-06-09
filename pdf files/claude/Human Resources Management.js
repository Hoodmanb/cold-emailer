/**
 * ================================================
 * CV DATA OBJECT - SINGLE SOURCE OF TRUTH
 * ================================================
 *
 * This object contains ALL content for the CV.
 * Modify this object to update the generated PDF.
 * All rendering is data-driven from this object.
 *
 * INSTRUCTIONS:
 * 1. Update the cvData object below with your content
 * 2. Follow the exact structure shown (arrays, objects, strings)
 * 3. Do NOT modify the render.js - it reads from this data
 * 4. Special characters are supported
 * 5. Leave arrays empty [] if you have no content for that section
 */

const cvData = {
  // ============ HEADER INFORMATION ============
  header: {
    name: "PAMILERIN FAYOSE",
    title:
      "MSc Human Resources Management | Business Operations & Customer Service Professional",
    contact: {
      phone: "+447350168547",
      email: "fpamilerinadeniyi@gmail.com",
      location: "Leeds, West Yorkshire, LS3 1AT",
    },
  },

  // ============ PROFESSIONAL SUMMARY ============
  summary: {
    title: "PROFESSIONAL SUMMARY",
    content:
      "MSc Human Resources Management student with 3+ years of experience in automotive sales, CRM, business development, and operations. Proven ability to build strong client relationships and drive revenue growth. Strong analytical and communication skills, supported by published research. Committed to people management, strategic HR operations, and continuous improvement.",
  },

  // ============ Leadership ============
  leadership: [
    "Managed business operations, customer relationships, and logistics activities.",
    "Coordinated planning and administrative processes supporting business objectives.",
    "Demonstrated initiative, commercial awareness, and decision-making through business ownership.",
  ],

  // ============ Key Achievments ============
  achievements: [
    "Published undergraduate research project in 2024 on entrepreneurial passion and decision-making.",
    "Founded and managed registered businesses while completing a university degree.",
    "Currently pursuing an MSc in Human Resources Management at York St John University.",
    "Earned Trade Test Certificates Grades 1, 2 and 3 demonstrating commitment to professional development.",
  ],

  // ============ WORK HISTORY ============
  workHistory: [
    {
      jobTitle: "Deputy housekeeper",
      company: "HOLIDAY INN",
      dateRange: "Feb 2026 - June 2026",
      // location: "Leeds, West Yorkshire",
      responsibilities: [
        "Inspected 40–60 guest rooms daily to ensure cleanliness standards before guest check-in.",
        "Oversaw administrative tasks, record management and operational planning.",
        "Developed strong leadership, organisational, and problem-solving skills.",
        "Contributed to high guest satisfaction scores by maintaining housekeeping standards and service quality.",
      ],
    },
    {
      jobTitle: "Manager",
      company: "DAILY DEAL ARRIVALS",
      dateRange: "Mar 2023 - Sep 2025",
      // location: "Ibadan, Oyo",
      responsibilities: [
        "Built and maintained relationships with customers, suppliers, and business partners, supporting daily business operations and growth.",
        "Resolved supply chain disruptions quickly to prevent production delays and customer complaints",
        "Developed strong leadership, organisational, and problem-solving skills.",
        "⁠Designed workload plans that allowed bike delivery staff to increase both productivity and earnings",
      ],
    },
    {
      jobTitle: "Car Sales Executive",
      company: "DAILY DEAL AUTOS",
      dateRange: "May 2021 - June 2024",
      // location: "Lagos, Nigeria",
      responsibilities: [
        "Delivered consistent year on year sales growth.",
        "Assisted customers with vehicle enquiries and the sales process.",
        "Successfully expanded market share and customer base.",
        "Contributed to sustained sales growth through effective team leadership and business development",
        "Led initiatives that improved operational efficiency and customer engagement.",
      ],
    },
    {
      jobTitle: "Sales Advisor",
      company: "DABOS CREATIVES",
      dateRange: "Sep 2017 - Feb 2019",
      // location: "Ibadan, Oyo",
      responsibilities: [
        "Actively engaged with customers on the sales floor, providing product information and assistance.",
        "Demonstrated in-depth knowledge of products and services to guide customers in making informed purchasing decisions.",
        "Collaborated with the marketing team to implement sales promotions and drive customer traffic.",
        "Achieved customer satisfaction ratings above 95%.",
      ],
    },
  ],

  // ============ EDUCATION ============
  education: [
    {
      degree: "MASTER OF SCIENCE",
      field: "Human Resources Management",
      institution: "York St John University, York",
      dateRange: "Sep 2025 - Current",
    },
    {
      degree: "BACHELOR OF SCIENCE",
      field: "Psychology",
      institution: "Ekiti State University, Nigeria",
      dateRange: "Jun 2018 - Mar 2024",
    },
  ],

  // ============ CERTIFICATIONS & ENTREPRENEURSHIP ============
  certifications: [
    {
      title: "Trade Test Certificate Grade 1, 2 and 3",
      details:
        "Motor Vehicle Mechanic Work – Confirmation of Competence – Skills Development and Certification Department, Federal Ministry of Labor and Productivity, Nigeria (2020)",
    },
    {
      title: "Business Registration Certificate",
      details: "DDA Daily Deal Autos - Nigeria (2022)",
    },
  ],

  // ============ RELEVANT MSc MODULES ============
  mscModules: [
    "Talent Management",
    "Employee Relations",
    "Organisational Behaviour",
    "Leadership and Management",
    "Research Methods",
  ],

  // ============ RESEARCH & PUBLICATIONS ============
  research: [
    {
      title: "Published Undergraduate Research Study (2024)",
      details:
        "Attitude Towards Money and Tolerance for Ambiguity as Predictors of Entrepreneurial Passion: A study among entrepreneurs in Ado Ekiti Metropolis. Demonstrating strong research, analytical, and report-writing skills.",
    },
  ],

  // ============ SKILLS ============
  skills: [
    {
      category: "Technical & Professional",
      items: [
        "Microsoft Office (Word, Excel, PowerPoint)",
        "Report Writing & Data Analysis",
        "Attention to Detail & Reliability",
      ],
    },
    {
      category: "Interpersonal & Management",
      items: [
        "Teamwork & Collaboration",
        "Customer Service",
        "Professional Communication",
        "Time Management",
      ],
    },
    {
      category: "Professional Skills",
      items: [
        "Stakeholder Management",
        "Project Coordination",
        "Administrative Support",
        "Commercial Awareness",
        "Quality inspection & standard compliance",
        "Guest complaint resolution",
        "Problem-Solving & Initiative",
        "Organisational & Research Skills",
      ],
    },
  ],

  // ============ CORE COMPETENCIES ============
  competencies: [
    "Emotional Intelligence",
    "Customer Service",
    "Employee Support",
    "Innovative Thinking",
    "Workload Prioritisation",
    "Team Collaboration",
    "Multitasking & Time Management",
    "Communication & Interpersonal Skills",
    "Leadership & Business Operations",
  ],

  // ============ REFERENCES ============
  references: "Available on request",
};

// ============ DATA VALIDATION ============
// Optional: Add validation to ensure data structure is correct
function validateCVData(data) {
  const requiredFields = ["header", "summary", "workHistory", "education"];
  for (const field of requiredFields) {
    if (!data[field]) {
      console.error(`Missing required field: ${field}`);
    }
  }
  console.log("CV Data validation complete");
}

// Validate on load
if (typeof cvData !== "undefined") {
  validateCVData(cvData);
}
