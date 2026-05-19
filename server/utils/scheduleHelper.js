/**
 * Given a recipients array and a templates map,
 * prepare recipients with initialized statuses for each valid template.
 * Ported from cold-emailer/server/utils/scheduleHelper.js
 */
const prepareRecipients = (recipients, templates) => {
  const validTemplateKeys = Object.entries(templates)
    .filter(([, template]) => {
      return (
        template &&
        template.subject &&
        template.body &&
        template.subject.trim() !== '' &&
        template.body.trim() !== ''
      );
    })
    .map(([key]) => key);

  return recipients.map((recipient) => {
    const statuses = {};
    validTemplateKeys.forEach((templateKey) => {
      statuses[templateKey] = 'pending';
    });
    return {
      ...recipient,
      statuses,
      disabled: recipient.disabled || false,
    };
  });
};

module.exports = { prepareRecipients };
