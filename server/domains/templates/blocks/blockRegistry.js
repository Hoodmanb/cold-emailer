/**
 * Canonical block definitions for document templates.
 * Builder, renderer, and AI all reference this registry.
 */

const BLOCK_REGISTRY = Object.freeze({
  profile: {
    id: 'profile',
    type: 'profile',
    title: 'Profile',
    description: 'Name, contact info, and summary',
    aiFillable: true,
    renderable: true,
  },
  summary: {
    id: 'summary',
    type: 'summary',
    title: 'Summary',
    description: 'Professional summary',
    aiFillable: true,
    renderable: true,
  },
  experience: {
    id: 'experience',
    type: 'experience',
    title: 'Experience',
    description: 'Work history and positions',
    aiFillable: true,
    renderable: true,
  },
  education: {
    id: 'education',
    type: 'education',
    title: 'Education',
    description: 'Degrees and institutions',
    aiFillable: true,
    renderable: true,
  },
  skills: {
    id: 'skills',
    type: 'skills',
    title: 'Skills',
    description: 'Technical and soft skills',
    aiFillable: true,
    renderable: true,
  },
  projects: {
    id: 'projects',
    type: 'projects',
    title: 'Projects',
    description: 'Personal or professional projects',
    aiFillable: true,
    renderable: true,
  },
  certificates: {
    id: 'certificates',
    type: 'certificates',
    title: 'Certifications',
    description: 'Certifications and credentials',
    aiFillable: true,
    renderable: true,
  },
  references: {
    id: 'references',
    type: 'references',
    title: 'References',
    description: 'Professional references',
    aiFillable: true,
    renderable: true,
  },
});

const DEFAULT_BLOCK_ORDER = [
  'profile',
  'experience',
  'education',
  'skills',
  'projects',
  'certificates',
];

function getBlockDefinition(blockId) {
  return BLOCK_REGISTRY[blockId] || {
    id: blockId,
    type: blockId,
    title: blockId.charAt(0).toUpperCase() + blockId.slice(1),
    description: '',
    aiFillable: true,
    renderable: true,
  };
}

function buildDefaultBlocks(blockIds = DEFAULT_BLOCK_ORDER) {
  const blocks = {};
  for (const id of blockIds) {
    const def = getBlockDefinition(id);
    blocks[id] = { type: def.type, title: def.title };
  }
  return blocks;
}

function buildDefaultLayout(blockIds = DEFAULT_BLOCK_ORDER) {
  return { type: 'single-column', blocks: [...blockIds] };
}

module.exports = {
  BLOCK_REGISTRY,
  DEFAULT_BLOCK_ORDER,
  getBlockDefinition,
  buildDefaultBlocks,
  buildDefaultLayout,
};
