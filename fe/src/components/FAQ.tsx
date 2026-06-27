import React from "react";
import { Box, Container, Typography, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How does Job Bot find suitable jobs?",
    answer: "Job Bot uses AI to parse your resume, match keywords with job postings, and rank opportunities based on fit and response likelihood."
  },
  {
    question: "Is my data stored locally?",
    answer: "All your career data stays on your device. We never upload resumes or personal information to the cloud unless you explicitly share it."
  },
  {
    question: "Can I use Job Bot for free?",
    answer: "Yes – the core AI matching, resume tailoring, and email outreach are free with unlimited usage. Premium credits unlock advanced analytics."
  },
  {
    question: "Do I need a credit card?",
    answer: "No. Signing up is instant and does not require payment information."
  }
];

export default function FAQSection() {
  return (
    <Box sx={{ py: { xs: 8, md: 12 }, backgroundColor: "background.paper" }} id="faq">
      <Container maxWidth="md">
        <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom sx={{ fontSize: { xs: "2rem", md: "3rem" } }}>
          Frequently Asked Questions
        </Typography>
        {faqs.map((item, idx) => (
          <Accordion key={idx} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ChevronDown />}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>{item.question}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>{item.answer}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Container>
    </Box>
  );
}
