import { useState } from "react";
import { Clock3, Save, Type } from "lucide-react";
import Button from "../ui/Button";
import { Input, TextArea, Field } from "../ui/FormField";
import { Alert } from "../ui/ErrorState";
import { DIFFICULTIES } from "../../utils/difficulty";
import { readingMinutes, wordCount } from "../../utils/format";
import { validateStory } from "../../utils/validators";

const EMPTY = { title: "", content: "", difficulty: "easy" };

export default function StoryForm({ initialValues, onSubmit, onCancel, submitLabel = "Save story", serverError }) {
  const [values, setValues] = useState({ ...EMPTY, ...initialValues });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) => {
    const value = event.target.value;
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validateStory(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await onSubmit({
        title: values.title.trim(),
        content: values.content.trim(),
        difficulty: values.difficulty,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const words = wordCount(values.content);

  return (
    <form className="story-form" onSubmit={handleSubmit} noValidate>
      <Alert>{serverError}</Alert>

      <Input
        label="Title"
        placeholder="e.g. The Little Fox"
        value={values.title}
        onChange={update("title")}
        error={errors.title}
        maxLength={140}
        required
      />

      <Field label="Difficulty" htmlFor="difficulty-easy" error={errors.difficulty} required>
        <div className="choice-group" role="radiogroup" aria-label="Difficulty">
          {DIFFICULTIES.map((d) => (
            <label key={d.value} className={`choice ${values.difficulty === d.value ? "is-selected" : ""}`}>
              <input
                id={`difficulty-${d.value}`}
                type="radio"
                name="difficulty"
                value={d.value}
                checked={values.difficulty === d.value}
                onChange={update("difficulty")}
              />
              <span className={`choice__dot choice__dot--${d.value}`} aria-hidden="true" />
              <span className="choice__text">
                <strong>{d.label}</strong>
                <small>{d.level}</small>
              </span>
            </label>
          ))}
        </div>
      </Field>

      <TextArea
        label="Story text"
        placeholder="Write the story here. Leave an empty line between paragraphs."
        value={values.content}
        onChange={update("content")}
        error={errors.content}
        rows={14}
        required
        aside={
          <span className="field__counter">
            <Type size={13} aria-hidden="true" /> {words} words
            <Clock3 size={13} aria-hidden="true" /> ~{readingMinutes(values.content)} min
          </span>
        }
      />

      <div className="story-form__actions">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" icon={Save} loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
