async function isUserAdmin({client, userId}) {
    try {
      const res = await client.users.info({ user: userId });
      return Boolean(res.user?.is_admin || res.user?.is_owner);
    } catch (err) {
      console.error('⚠️ Error checking user admin status:', err);
      return false;
    }
  }

module.exports = isUserAdmin