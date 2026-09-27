import { useEffect } from "react";

export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Speakify` : "Speakify: Speak. Practice. Improve.";
  }, [title]);
}
