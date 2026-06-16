/**
 * ================================================
 * CV DATA OBJECT - SALES ROLES
 * ================================================
 *
 * Tailored for: Sales Roles
 * All real data intact. Only role-specific sections adjusted.
 */

const cvData = {
  header: {
    name: "PAMILERIN FAYOSE",
    contact: {
      phone: "+447350168547",
      email: "fpamilerinadeniyi@gmail.com",
      linkedIn: "https://www.linkedin.com/in/pamilerin-fayose-b66642413",
      location: "Leeds, West Yorkshire, LS3 1AT",
    },
    title: "Sales & Business Development Professional",
  },
  summary: {
    title: "PROFESSIONAL SUMMARY",
    content:
      "Ambitious professional with 3+ years of experience in automotive sales, hospitality, business development, and operations. Proven ability to build strong client relationships and drive revenue growth. Strong analytical and communication skills, supported by published research. Committed to people management, strategic HR operations, and continuous improvement.",
  },
  leadership: [
    "Published undergraduate research in 2024 on entrepreneurial passion and decision-making.",
    "Founded and managed registered businesses while completing a university degree.",
    "Earned Trade Test Certificates Grades 1, 2, and 3, demonstrating commitment to professional development.",
  ],
  achievements: [
    "Published undergraduate research project in 2024 on entrepreneurial passion and decision-making.",
    "Founded and managed registered businesses while completing a university degree, demonstrating sales and entrepreneurial drive.",
    "Currently pursuing an MSc in Human Resources Management at York St John University.",
    "Earned Trade Test Certificates Grades 1, 2 and 3 demonstrating commitment to professional development.",
  ],
  workHistory: [
    {
      jobTitle: "Deputy housekeeper",
      company: "HOLIDAY INN",
      dateRange: "Feb 2026 - June 2026",
      // "location": "Leeds, West Yorkshire",
      responsibilities: [
        "Delivered exceptional guest service, ensuring high satisfaction scores and repeat bookings.",
        "Trained new Room Attendants on service standards, improving team performance and guest feedback.",
        "Inspected 40\u201360 guest rooms daily to ensure cleanliness standards before guest check-in.",
        "Trained new Room Attendants on service standards, guest interaction, and hotel protocols.",
        "Contributed to high guest satisfaction scores by maintaining housekeeping standards and service quality.",
      ],
    },
    {
      jobTitle: "Logistics Manager",
      company: "DAILY DEAL ARRIVALS",
      dateRange: "Mar 2023 - Sep 2025",
      // "location": "Ibadan, Oyo",
      responsibilities: [
        "Managed third-party logistics providers and tracked performance to maintain service levels.",
        "Resolved supply chain disruptions quickly to prevent production delays and customer complaints.",
        "Designed workload plans that allowed bike delivery staff to increase both productivity and earnings.",
        "Developed strong leadership, organisational, and problem-solving skills through team coordination.",
        "Achieved customer satisfaction ratings above 95% through consistent service excellence.",
      ],
    },
    {
      jobTitle: "Lead Car Sales Executive",
      company: "DAILY DEAL AUTOS",
      dateRange: "May 2021 - June 2024",
      // "location": "Lagos, Nigeria",
      responsibilities: [
        "Delivered consistent year on year sales growth.",
        "Built and maintained a strong client base, driving repeat business and referrals.",
        "Successfully expanded market share and customer base.",
        "Contributed to sustained sales growth through effective team leadership and business development.",
        "Led initiatives that improved operational efficiency and customer engagement.",
        "Maintained knowledge of vehicle conditions and market prices to negotiate effectively and close deals.",
      ],
    },
    {
      jobTitle: "Sales Advisor",
      company: "DABOS CREATIVES",
      dateRange: "Sep 2017 - Feb 2019",
      // "location": "Ibadan, Oyo",
      responsibilities: [
        "Actively engaged with customers on the sales floor, providing product information and personalised assistance.",
        "Demonstrated in-depth product knowledge to guide customers in making informed purchasing decisions.",
        "Collaborated with the marketing team to implement sales promotions and drive customer traffic.",
      ],
    },
  ],
  education: [
    {
      degree: "MSc HRM",
      field: "Human Resources Management",
      institution: "York St John University, York",
      dateRange: "Sep 2025 - Sep 2026",
    },
    {
      degree: "BACHELOR OF SCIENCE",
      field: "Psychology",
      institution: "Ekiti State University, Nigeria",
      dateRange: "Jun 2018 - Mar 2024",
    },
  ],
  certifications: [
    {
      title: "Trade Test Certificate Grade 1, 2 and 3",
      details:
        "Motor Vehicle Mechanic Work \u2013 Confirmation of Competence \u2013 Skills Development and Certification Department, Federal Ministry of Labor and Productivity, Nigeria (2020)",
    },
    {
      title: "Business Registration Certificate",
      details: "DDA Daily Deal Autos - Nigeria (2022)",
    },
  ],
  mscModules: [
    "Leadership and Management",
    "Employee Relations",
    "Organisational Behaviour",
    "Talent Management",
    "Research Methods",
  ],
  research: [
    {
      title: "Published Undergraduate Research Study (2024)",
      details:
        "Attitude Towards Money and Tolerance for Ambiguity as Predictors of Entrepreneurial Passion: A study among entrepreneurs in Ado Ekiti Metropolis. Demonstrating strong research, analytical, and report-writing skills.",
    },
  ],
  skills: [
    // {
    //     "category": "Sales & Business Development",
    //     "items": [
    //         "B2B & B2C Sales",
    //         "CRM & Client Relationship Management",
    //         "Revenue Growth & Target Achievement",
    //         "Negotiation & Closing"
    //     ]
    // },
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

  ],
  competencies: [
    "Customer Relationship Management",
    "Revenue Generation",
    "Negotiation & Persuasion",
    "Customer Service",
    "Innovative Thinking",
    "Workload Prioritisation",
    "Team Collaboration",
    "Multitasking & Time Management",
    "Communication & Interpersonal Skills",
    "Leadership & Business Operations",
  ],
  references: "Available on request",
};

// ============ DATA VALIDATION ============
function validateCVData(data) {
  const requiredFields = ["header", "summary", "workHistory", "education"];
  for (const field of requiredFields) {
    if (!data[field]) {
      console.error(`Missing required field: ${field}`);
    }
  }
  console.log("CV Data validation complete");
}

if (typeof cvData !== "undefined") {
  validateCVData(cvData);
}
