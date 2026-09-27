// Turns any axios error into a message that is safe to show to the user.
// The backend always replies with { success: false, message } on errors.
export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (!error) return fallback;

  if (error.response) {
    const message = error.response.data?.message;

    // The backend returns 500 with a Mongoose CastError for malformed ids.
    if (typeof message === "string" && message.includes("Cast to ObjectId")) {
      return "We couldn't find that item. The link may be broken.";
    }
    if (typeof message === "string" && message.trim()) return message;
    if (error.response.status === 404) return "Not found.";
    if (error.response.status >= 500) return "The server ran into a problem. Please try again.";
    return fallback;
  }

  if (error.code === "ECONNABORTED") {
    return "The request timed out. Please check your connection.";
  }

  if (error.request) {
    return "Can't reach the Speakify server. Check your internet connection, or make sure the backend is running.";
  }

  return error.message || fallback;
}

export function isNotFound(error) {
  const status = error?.response?.status;
  const message = error?.response?.data?.message || "";
  return status === 404 || message.includes("Cast to ObjectId");
}
