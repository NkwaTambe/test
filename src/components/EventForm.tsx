import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { Camera, Upload, Send, Save } from "lucide-react";
import { toast } from "sonner";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import type { Label, LocalizedText } from "../labels/label-manager";
import { createEventPackage, validateFormData } from "../utils/event-packer";
import {
  exportEventPackageAsZip,
  downloadEventPackage,
} from "../utils/zip-exporter";
import type { KeyPair } from "../hooks/useKeyInitialization";

type FieldValue = string | number | boolean | null;

interface FormData extends Record<string, FieldValue> {}

// Helper to get localized text from a string or LocalizedText object
const getLocalizedText = (text: string | LocalizedText | undefined): string => {
  if (!text) return "";
  if (typeof text === "string") return text;
  return text.en; // Default to English for now, will be updated with i18n
};

interface EventFormProps {
  labels: Label[];
  keyPair?: KeyPair;
  createdBy?: string;
}

const EventForm: React.FC<EventFormProps> = ({ labels, createdBy }) => {
  const { t, i18n } = useTranslation();
  const { category } = useParams<{ category: string }>();
  const [formData, setFormData] = useState<FormData>({
    "3": category || "", // Pre-fill category from URL params
  });
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  // Remove cameraActive and CameraCapture logic
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, type } = e.target;
    const target = e.target as HTMLInputElement;
    let value: FieldValue;
    if (type === "checkbox") {
      value = target.checked;
    } else if (type === "number") {
      value = target.value === "" ? null : Number(target.value);
    } else {
      value = target.value === "" ? null : target.value;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setMediaFile(e.target.files[0]);
      setErrors((prev) => ({ ...prev, media: "" }));
    }
  };

  // Replace renderMediaSection with a direct file input for camera capture
  const handlePhotoInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setMediaFile(e.target.files[0]);
      setErrors((prev) => ({ ...prev, media: "" }));
    }
  };

  const validate = useCallback((): boolean => {
    // Create a clean data object with only the fields that match our labels
    const cleanData: Record<string, FieldValue> = {};
    labels.forEach((label) => {
      if (formData[label.labelId] !== undefined) {
        cleanData[label.labelId] = formData[label.labelId];
      }
    });
    const { isValid: isFormDataValid, errors: formErrors } = validateFormData(
      cleanData,
      labels,
    );
    const newErrors: Record<string, string> = { ...formErrors };
    if (!mediaFile) {
      newErrors.media = t("mediaRequired");
    }
    setErrors(newErrors);
    return isFormDataValid && Object.keys(newErrors).length === 0;
  }, [formData, labels, mediaFile, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      if (!mediaFile) throw new Error(t("mediaRequired"));
      // Create a clean data object with only the fields that match our labels
      const cleanData: Record<string, FieldValue> = {};
      labels.forEach((label) => {
        if (formData[label.labelId] !== undefined) {
          cleanData[label.labelId] = formData[label.labelId];
        }
      });
      const eventPackage = await createEventPackage(
        cleanData,
        labels,
        mediaFile,
        {
          createdBy,
          source: "web",
        },
      );


      // Check for missing env vars
      if (
        !import.meta.env.VITE_AWS_REGION ||
        !import.meta.env.VITE_AWS_ACCESS_KEY_ID ||
        !import.meta.env.VITE_AWS_SECRET_ACCESS_KEY ||
        !import.meta.env.VITE_S3_BUCKET_NAME
      ) {
        toast.error(
          "AWS configuration is missing. Please check your .env.local file and restart the dev server.",
        );
        throw new Error("Missing AWS configuration");
      }

      // S3 Upload Logic
      const s3Client = new S3Client({
        region: import.meta.env.VITE_AWS_REGION,
        credentials: {
          accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
          secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
        },
      });

      const zipBlob = await exportEventPackageAsZip(eventPackage);
      const zipArrayBuffer = await zipBlob.arrayBuffer();

      const uploadParams = {
        Bucket: import.meta.env.VITE_S3_BUCKET_NAME,
        Key: `event-${Date.now()}.zip`,
        Body: zipArrayBuffer,
        ContentType: "application/zip",
      };

      await s3Client.send(new PutObjectCommand(uploadParams));

      setFormData({});
      setMediaFile(null);

      toast.success(t("eventSaved"));
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error(t("saveError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for saving the current form data as a draft
  const handleSaveDraft = useCallback(async () => {
    try {
      if (!mediaFile) throw new Error(t("mediaRequired"));

      const cleanData: Record<string, FieldValue> = {};

      labels.forEach((label) => {
        if (formData[label.labelId] !== undefined) {
          cleanData[label.labelId] = formData[label.labelId];
        }
      });

      cleanData.description = formData.description || null;
      cleanData.priority = formData.priority || "medium";

      const eventPackage = await createEventPackage(
        cleanData,
        labels,
        mediaFile,
        {
          createdBy,
          source: "web",
        },
      );

      await downloadEventPackage(eventPackage);
      toast.success(t("draftSaved"));
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error(t("saveError"));
    }
  }, [formData, mediaFile, labels, createdBy, t]);

  const categoryLabel = labels.find((label) => label.labelId === "3");
  const categoryName = categoryLabel
    ? i18n.language === "fr"
      ? categoryLabel.name_fr
      : categoryLabel.name_en
    : "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-purple-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white/80 shadow-xl rounded-3xl px-8 py-10 w-full max-w-3xl relative overflow-hidden animate-fade-in-up">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight drop-shadow-sm">
            {t("newEventFor", { category: categoryName })}
          </h2>
          <p className="text-lg text-gray-600">{t("fillFormDetails")}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dynamic Form Fields from Labels */}
          <div className="space-y-6 bg-white/50 p-6 rounded-2xl shadow-sm border border-gray-100">
            {labels
              .filter((label) => label.type !== "media")
              .map((label) => {
                const labelName =
                  i18n.language === "fr" ? label.name_fr : label.name_en;
                const labelId = `field-${label.labelId}`;
                const error = errors[label.labelId];

                // Use textarea for description
                if (label.labelId === "4" && label.type === "text") {
                  return (
                    <div key={label.labelId} className="space-y-2">
                      <label
                        htmlFor={labelId}
                        className="block text-sm font-medium text-gray-700"
                      >
                        {labelName}{" "}
                        {label.required && (
                          <span className="text-red-500">*</span>
                        )}
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <textarea
                          id={labelId}
                          name={label.labelId}
                          value={(formData[label.labelId] as string) || ""}
                          onChange={handleChange}
                          className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 min-h-[120px] resize-y"
                          disabled={isSubmitting}
                          required={label.required}
                          placeholder={
                            getLocalizedText(label.placeholder) ||
                            t("describeEvent")
                          }
                        />
                      </div>
                      {error && (
                        <p className="mt-1 text-sm text-red-600">{error}</p>
                      )}
                      {label.helpText && (
                        <p className="mt-1 text-xs text-gray-500">
                          {getLocalizedText(label.helpText)}
                        </p>
                      )}
                    </div>
                  );
                }

                return (
                  <div key={label.labelId} className="space-y-2">
                    <label
                      htmlFor={labelId}
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      {labelName}
                      {label.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>

                    {/* Date Field */}
                    {label.type === "date" && (
                      <input
                        type="date"
                        id={labelId}
                        name={label.labelId}
                        value={(formData[label.labelId] as string) || ""}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
                        disabled={isSubmitting}
                        required={label.required}
                      />
                    )}

                    {/* Text Field */}
                    {label.type === "text" && (
                      <input
                        type="text"
                        id={labelId}
                        name={label.labelId}
                        value={String(formData[label.labelId] || "")}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
                        disabled={isSubmitting}
                        required={label.required}
                        placeholder={getLocalizedText(label.placeholder)}
                      />
                    )}

                    {/* Number Field */}
                    {label.type === "number" && (
                      <input
                        type="number"
                        id={labelId}
                        name={label.labelId}
                        value={Number(formData[label.labelId] || 0)}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
                        min={label.constraints?.min}
                        max={label.constraints?.max}
                        step={label.constraints?.step}
                        disabled={isSubmitting}
                        required={label.required}
                        placeholder={getLocalizedText(label.placeholder)}
                      />
                    )}

                    {/* Boolean Field */}
                    {label.type === "boolean" && (
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={labelId}
                          name={label.labelId}
                          checked={!!formData[label.labelId]}
                          onChange={handleChange}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 accent-blue-500"
                          disabled={isSubmitting}
                        />
                      </div>
                    )}

                    {/* Enum Field */}
                    {label.type === "enum" && label.options && (
                      <select
                        id={labelId}
                        name={label.labelId}
                        value={(formData[label.labelId] as string) || ""}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
                        disabled={isSubmitting}
                      >
                        <option value="">{t("selectOption")}</option>
                        {label.options?.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}

                    {error && (
                      <p className="mt-1 text-sm text-red-600">{error}</p>
                    )}
                    {label.helpText && (
                      <p className="mt-1 text-xs text-gray-500">
                        {getLocalizedText(label.helpText)}
                      </p>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Media Section - Camera, Upload, and Drag-and-Drop */}
          <div className="mb-4 bg-white/70 p-6 rounded-2xl shadow-inner border border-gray-100">
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <label className="bg-blue-500 text-white px-5 py-3 rounded-full shadow-md hover:bg-blue-600 flex items-center cursor-pointer transition-all duration-200">
                <Upload className="inline mr-2" size={18} />
                {t("uploadMedia")}
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
              <label className="bg-green-500 text-white px-5 py-3 rounded-full shadow-md hover:bg-green-600 flex items-center cursor-pointer transition-all duration-200">
                <Camera className="mr-2" size={18} />
                {t("takePhoto")}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoInput}
                />
              </label>
            </div>
            {/* Drag-and-drop area for desktop */}
            <div className="hidden md:block mt-4">
              <div
                className="border-2 border-dashed border-blue-300 bg-blue-50/30 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 transition-all duration-200"
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) {
                    setMediaFile(e.dataTransfer.files[0]);
                    setErrors((prev) => ({ ...prev, media: "" }));
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
              >
                <p className="text-base text-blue-500 font-medium">
                  {t("orDragAndDrop")}
                </p>
              </div>
            </div>
            {mediaFile && (
              <div className="relative mt-6 flex flex-col items-center">
                <img
                  src={URL.createObjectURL(mediaFile)}
                  alt="Preview"
                  className="max-h-64 mx-auto mb-4 rounded-xl shadow-md border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => setMediaFile(null)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 shadow-md"
                  title="Remove image"
                >
                  &times;
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-4 mt-10">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSubmitting || !mediaFile}
              className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-md text-base font-semibold rounded-full text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Save className="h-5 w-5 mr-2" />
              {t("save")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !mediaFile}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-semibold rounded-full shadow-md text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {t("saving")}
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  {t("submit")}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventForm;
