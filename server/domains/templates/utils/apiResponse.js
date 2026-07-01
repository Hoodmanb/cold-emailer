/**
 * Standardized template API response helpers.
 * Maintains backward compatibility via legacy aliases on data payload.
 */

function templateListResponse(items, options = {}) {
  const {
    starredIds = [],
    total = items.length,
    page = 1,
    pageSize = items.length,
    message = 'Templates retrieved successfully',
  } = options;

  return {
    success: true,
    message,
    data: {
      items,
      total,
      page,
      pageSize,
      starredIds,
      // Backward compatibility aliases
      templates: items,
      count: total,
    },
  };
}

function templateItemResponse(item, options = {}) {
  const { message = 'Template retrieved successfully', statusCode = 200 } = options;
  return {
    statusCode,
    body: {
      success: true,
      message,
      data: item,
      // Legacy email update key
      template: item,
    },
  };
}

function templateErrorResponse(message, statusCode = 500, error = null) {
  return {
    statusCode,
    body: {
      success: false,
      message,
      ...(error ? { error: String(error) } : {}),
    },
  };
}

/** Normalize raw controller array or wrapped payload into items[] */
function normalizeListPayload(rawData) {
  if (!rawData) return { items: [], starredIds: [] };
  if (Array.isArray(rawData)) return { items: rawData, starredIds: [] };
  if (Array.isArray(rawData.items)) {
    return {
      items: rawData.items,
      starredIds: rawData.starredIds || rawData.templates?.starredIds || [],
      total: rawData.total,
      page: rawData.page,
    };
  }
  if (Array.isArray(rawData.templates)) {
    return {
      items: rawData.templates,
      starredIds: rawData.starredIds || [],
      total: rawData.total ?? rawData.templates.length,
      page: rawData.page ?? 1,
    };
  }
  return { items: [], starredIds: [] };
}

module.exports = {
  templateListResponse,
  templateItemResponse,
  templateErrorResponse,
  normalizeListPayload,
};
