const documentTemplateRepo = require('../server/repositories/documentTemplateRepository');

async function fixApprovalStatus() {
  const all = await documentTemplateRepo.listAll();
  for (const tmpl of all) {
    if (!tmpl.approvalStatus) {
      await documentTemplateRepo.update(tmpl.id, { approvalStatus: 'approved' }, null);
      console.log(`Updated template ${tmpl.id} with approved status`);
    }
  }
  console.log('All templates processed');
}

fixApprovalStatus().catch(err => {
  console.error('Error updating templates', err);
  process.exit(1);
});
