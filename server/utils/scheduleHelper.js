exports.prepareRecipients = (recipients, templates) => {
  const validTemplateKeys = Object.entries(templates)
    .filter(([key, template]) => {
      return (
        template &&
        template.subject &&
        template.body &&
        template.subject.trim() !== "" &&
        template.body.trim() !== ""
      );
    })
    .map(([key]) => key);

  // Map each recipient to include statuses for valid templates
  return recipients.map((recipient) => {
    const statuses = {};

    // Assign 'pending' status for each valid template
    validTemplateKeys.forEach((templateKey) => {
      console.log("nwigiri", templateKey);
      statuses[templateKey] = "pending";
    });

    return {
      ...recipient,
      statuses,
      disabled: recipient.disabled || false,
    };
  });
};
