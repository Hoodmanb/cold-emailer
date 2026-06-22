require('dotenv').config();
/*
  cleanDocumentTemplates.js
  This script deletes all existing document templates and re‑seeds the default templates
  using UUID IDs. It requires Supabase service role credentials to be set in the environment:
    SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
*/

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
const { seedDefaultTemplates } = require('../services/templates/defaultTemplates');

// Initialize Supabase client with service role permissions
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to delete all rows from the document_templates table
async function truncateTemplates() {
  const { error } = await supabase.from('document_templates').delete().neq('id', '0'); // delete everything
  if (error) {
    console.error('Failed to delete existing templates:', error.message);
    process.exit(1);
  }
  console.log('All existing templates removed');
}

async function main() {
  try {
    await truncateTemplates();
    // Reseed defaults – defaultTemplates already generates UUIDs for each entry
    // but we ensure any missing IDs are replaced with a fresh UUID
    const defaultTemplates = require('../services/templates/defaultTemplates').DEFAULT_DOCUMENT_TEMPLATES.map(t => ({
      ...t,
      id: uuidv4(),
    }));
    // Insert using the repository's upsertMany for consistency
    const repo = require('../repositories/documentTemplateRepository');
    await repo.upsertMany(defaultTemplates);
    console.log('Default templates reseeded with UUID IDs');
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

main();
