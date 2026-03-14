const toPretty = (value) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch (_error) {
    return String(value);
  }
};

const setLoading = (el, label) => {
  el.textContent = label;
};

const setError = (el, message) => {
  el.textContent = `Error: ${message}`;
};

const callJson = async (url) => {
  const response = await fetch(url, { cache: 'no-store' });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || payload.detail || `HTTP ${response.status}`);
  }
  return payload;
};

export const initTools = ({ schemaButton, topicsButton, groupsButton, schemaOutput, topicsOutput, groupsOutput }) => {
  const checkSchema = async () => {
    setLoading(schemaOutput, 'Checking schema...');
    try {
      const payload = await callJson('/api/tools/project-management/schema-check');
      schemaOutput.textContent = toPretty(payload);
    } catch (error) {
      setError(schemaOutput, error.message);
    }
  };

  const checkTopics = async () => {
    setLoading(topicsOutput, 'Loading topics...');
    try {
      const payload = await callJson('/api/tools/topics');
      topicsOutput.textContent = toPretty(payload);
    } catch (error) {
      setError(topicsOutput, error.message);
    }
  };

  const checkGroups = async () => {
    setLoading(groupsOutput, 'Loading groups...');
    try {
      const payload = await callJson('/api/tools/consumer-groups');
      groupsOutput.textContent = toPretty(payload);
    } catch (error) {
      setError(groupsOutput, error.message);
    }
  };

  schemaButton.addEventListener('click', checkSchema);
  topicsButton.addEventListener('click', checkTopics);
  groupsButton.addEventListener('click', checkGroups);

  return {
    checkSchema,
    checkTopics,
    checkGroups,
  };
};