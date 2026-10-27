"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Column,
  Grid,
  Heading,
  Icon,
  IconButton,
  Input,
  Row,
  SegmentedControl,
  Select,
  Text,
  Textarea,
  type IconName,
} from "@once-ui-system/core";
import { useSearchParams } from "next/navigation";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import type { CommissionApiResponse } from "@/app/api/commissions/route";
import { Reveal } from "@/components/Reveal";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import {
  budgetRanges,
  contactLanguages,
  createCommissionSchema,
  projectTypes,
  REFERENCE_IMAGE_LIMITS,
  validateReferenceFiles,
  type CommissionInput,
  type ProjectType,
} from "@/lib/validation/commission";

type CommissionFormProps = {
  lang: Locale;
  t: Dictionary["commission"];
  /** slug -> localized title, to show which gallery piece inspired the request. */
  artworkTitles: Record<string, string>;
};

export function CommissionForm({ lang, t, artworkTitles }: CommissionFormProps) {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  const refParam = searchParams.get("ref");
  const sourceArtwork = refParam && artworkTitles[refParam] ? refParam : "";

  const schema = useMemo(() => createCommissionSchema(t.errors), [t.errors]);
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CommissionInput>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      projectType: (projectTypes as readonly string[]).includes(typeParam ?? "")
        ? (typeParam as ProjectType)
        : undefined,
      size: "",
      description: "",
      colors: "",
      referenceUrl: "",
      budget: undefined,
      deadline: "",
      contactLanguage: lang,
      sourceArtwork,
      website: "",
    },
  });

  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const projectType = useWatch({ control, name: "projectType" });
  const sizeCopy =
    projectType === "sneakers"
      ? { label: t.fields.shoeSize, hint: t.fields.sizeHintShoes }
      : projectType === "clothing"
        ? { label: t.fields.clothingSize, hint: t.fields.sizeHintClothing }
        : { label: t.fields.size, hint: t.fields.sizeHintCanvas };

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const next = [...files, ...Array.from(incoming)];
    const error = validateReferenceFiles(next, t.errors);
    setFileError(error);
    if (!error) setFiles(next);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const error = validateReferenceFiles(files, t.errors);
    if (error) {
      setFileError(error);
      return;
    }

    const body = new FormData();
    for (const [key, value] of Object.entries(values)) body.append(key, value ?? "");
    body.append("locale", lang);
    for (const file of files) body.append("referenceImages", file);

    try {
      const res = await fetch("/api/commissions", { method: "POST", body });
      const result = (await res.json()) as CommissionApiResponse;
      if (result.ok) {
        setSubmittedEmail(values.email);
        return;
      }
      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        if (field === "referenceImages") setFileError(message);
        else setError(field as keyof CommissionInput, { message });
      }
      setFormError(result.error);
    } catch {
      setFormError(t.errors.generic);
    }
  });

  if (submittedEmail) {
    return (
      <Column
        background="surface"
        border="success-alpha-medium"
        radius="l"
        padding="40"
        gap="16"
        horizontal="center"
        align="center"
        role="status"
        className="anim-rise"
      >
        <Row center width="56" height="56" radius="full" background="success-alpha-weak">
          <Icon name="circleCheck" size="l" onBackground="success-medium" />
        </Row>
        <Heading as="h2" variant="heading-strong-l">
          {t.success.title}
        </Heading>
        <Text variant="body-default-m" onBackground="neutral-medium">
          {t.success.body.replace("{email}", submittedEmail)}
        </Text>
        <Button
          variant="secondary"
          onClick={() => {
            reset();
            setFiles([]);
            setSubmittedEmail(null);
          }}
        >
          {t.success.another}
        </Button>
      </Column>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-describedby={formError ? "form-error" : undefined}>
      <Column background="surface" border radius="l" padding="32" gap="40" s={{ padding: "20" }}>
        {sourceArtwork && (
          <Row gap="8" vertical="center" padding="12" radius="m" background="accent-alpha-weak">
            <Icon name="sparkles" size="s" onBackground="accent-medium" />
            <Text variant="body-default-s" onBackground="neutral-strong">
              {t.inspiredBy}: <strong>{artworkTitles[sourceArtwork]}</strong>
            </Text>
          </Row>
        )}

        {/* Contact */}
        <FormSection icon="person" title={t.sections.contact}>
          <Grid columns="2" gap="16" s={{ columns: 1 }}>
            <Input
              id="name"
              label={t.fields.name}
              autoComplete="name"
              error={Boolean(errors.name)}
              errorMessage={errors.name?.message}
              {...register("name")}
            />
            <Input
              id="email"
              prefix={<Icon name="mail" size="xs" onBackground="neutral-weak" />}
              type="email"
              label={t.fields.email}
              autoComplete="email"
              error={Boolean(errors.email)}
              errorMessage={errors.email?.message}
              {...register("email")}
            />
          </Grid>
          <Input
            id="phone"
            type="tel"
            label={t.fields.phone}
            autoComplete="tel"
            description={t.fields.phoneHint}
            error={Boolean(errors.phone)}
            errorMessage={errors.phone?.message}
            {...register("phone")}
          />
        </FormSection>

        {/* Project */}
        <FormSection icon="paintbrush" title={t.sections.project}>
          <Grid columns="2" gap="16" s={{ columns: 1 }}>
            <Controller
              control={control}
              name="projectType"
              render={({ field }) => (
                <Select
                  id="projectType"
                  label={t.fields.projectType}
                  value={field.value ?? ""}
                  onSelect={(value) => field.onChange(value as ProjectType)}
                  onBlur={field.onBlur}
                  error={Boolean(errors.projectType)}
                  errorMessage={errors.projectType?.message}
                  options={projectTypes.map((type) => ({ value: type, label: t.projectTypes[type] }))}
                />
              )}
            />
            <Input
              id="size"
              label={sizeCopy.label}
              description={sizeCopy.hint}
              error={Boolean(errors.size)}
              errorMessage={errors.size?.message}
              {...register("size")}
            />
          </Grid>
          <Textarea
            id="description"
            label={t.fields.description}
            description={t.fields.descriptionHint}
            lines={5}
            error={Boolean(errors.description)}
            errorMessage={errors.description?.message}
            {...register("description")}
          />
          <Input
            id="colors"
            prefix={<Icon name="palette" size="xs" onBackground="neutral-weak" />}
            label={t.fields.colors}
            description={t.fields.colorsHint}
            error={Boolean(errors.colors)}
            errorMessage={errors.colors?.message}
            {...register("colors")}
          />
        </FormSection>

        {/* References */}
        <FormSection icon="gallery" title={t.sections.references}>
          <Input
            id="referenceUrl"
            prefix={<Icon name="link" size="xs" onBackground="neutral-weak" />}
            type="url"
            inputMode="url"
            label={t.fields.referenceUrl}
            description={t.fields.referenceUrlHint}
            error={Boolean(errors.referenceUrl)}
            errorMessage={errors.referenceUrl?.message}
            {...register("referenceUrl")}
          />
          <Column
            gap="12"
            padding="20"
            radius="l"
            border={fileError ? "danger-alpha-medium" : "neutral-alpha-medium"}
            borderStyle="dashed"
          >
            <Row gap="12" vertical="center" horizontal="between" s={{ direction: "column", horizontal: "start" }}>
              <Column gap="4">
                <Text as="label" htmlFor="referenceImages" variant="label-strong-s">
                  {t.fields.referenceImages}
                </Text>
                <Text id="referenceImages-hint" variant="body-default-xs" onBackground="neutral-weak">
                  {t.fields.referenceImagesHint}
                </Text>
              </Column>
              <Button
                type="button"
                variant="secondary"
                size="s"
                prefixIcon="upload"
                disabled={files.length >= REFERENCE_IMAGE_LIMITS.maxFiles}
                onClick={() => fileInputRef.current?.click()}
              >
                {t.fields.chooseFiles}
              </Button>
              <input
                ref={fileInputRef}
                id="referenceImages"
                type="file"
                accept="image/*"
                multiple
                hidden
                aria-describedby="referenceImages-hint"
                onChange={(event) => addFiles(event.target.files)}
              />
            </Row>
            {files.length > 0 && (
              <Column as="ul" gap="8" margin="0" padding="0">
                {files.map((file, index) => (
                  <Row
                    as="li"
                    key={`${file.name}-${index}`}
                    vertical="center"
                    horizontal="between"
                    gap="8"
                    paddingX="12"
                    paddingY="8"
                    radius="m"
                    background="neutral-alpha-weak"
                    style={{ listStyle: "none" }}
                  >
                    <Row gap="8" vertical="center" fillWidth>
                      <Icon name="image" size="s" onBackground="neutral-weak" />
                      <Text variant="body-default-s" truncate>
                        {file.name}
                      </Text>
                      <Text variant="body-default-xs" onBackground="neutral-weak">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </Text>
                    </Row>
                    <IconButton
                      icon="close"
                      variant="ghost"
                      size="s"
                      tooltip={t.fields.removeFile}
                      ariaLabel={`${t.fields.removeFile} ${file.name}`}
                      onClick={() => {
                        setFiles(files.filter((_, i) => i !== index));
                        setFileError(null);
                      }}
                    />
                  </Row>
                ))}
              </Column>
            )}
            {fileError && (
              <Text role="alert" variant="body-default-s" onBackground="danger-medium">
                {fileError}
              </Text>
            )}
          </Column>
        </FormSection>

        {/* Logistics */}
        <FormSection icon="wallet" title={t.sections.logistics}>
          <Grid columns="2" gap="16" s={{ columns: 1 }} style={{ alignItems: "end" }}>
            <Controller
              control={control}
              name="budget"
              render={({ field }) => (
                <Select
                  id="budget"
                  label={t.fields.budget}
                  value={field.value ?? ""}
                  onSelect={(value) => field.onChange(value)}
                  onBlur={field.onBlur}
                  error={Boolean(errors.budget)}
                  errorMessage={errors.budget?.message}
                  options={budgetRanges.map((range) => ({ value: range, label: t.budgets[range] }))}
                />
              )}
            />
            {/* Native date inputs draw their own mm/dd/yyyy text, which collides with a
                floating label, so this field gets a static label above it instead. */}
            <Column gap="8">
              <Text as="label" htmlFor="deadline" variant="label-default-s" onBackground="neutral-medium">
                {t.fields.deadline}
              </Text>
              <Input
                id="deadline"
              prefix={<Icon name="calendarHeart" size="xs" onBackground="neutral-weak" />}
                type="date"
                error={Boolean(errors.deadline)}
                errorMessage={errors.deadline?.message}
                {...register("deadline")}
              />
            </Column>
          </Grid>
          <Column gap="8">
            <Text id="contactLanguage-label" variant="label-default-s" onBackground="neutral-medium">
              {t.fields.contactLanguage}
            </Text>
            <Controller
              control={control}
              name="contactLanguage"
              render={({ field }) => (
                <SegmentedControl
                  aria-labelledby="contactLanguage-label"
                  semantics="radio"
                  fillWidth={false}
                  value={field.value}
                  onChange={(value) => field.onChange(value)}
                  buttons={contactLanguages.map((code) => ({
                    value: code,
                    label: t.languages[code],
                  }))}
                />
              )}
            />
          </Column>
        </FormSection>

        {/* Honeypot: hidden from people and assistive tech, tempting to bots. */}
        <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", height: 0, overflow: "hidden" }}>
          <label htmlFor="website">Website</label>
          <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
        </div>
        <input type="hidden" {...register("sourceArtwork")} />

        <Column gap="12">
          {formError && (
            <Row
              id="form-error"
              role="alert"
              gap="8"
              vertical="center"
              padding="12"
              radius="m"
              background="danger-alpha-weak"
            >
              <Icon name="danger" size="s" onBackground="danger-medium" />
              <Text variant="body-default-s" onBackground="danger-strong">
                {formError}
              </Text>
            </Row>
          )}
          <Button type="submit" size="l" fillWidth loading={isSubmitting} disabled={isSubmitting} suffixIcon="send">
            {isSubmitting ? t.submitting : t.submit}
          </Button>
        </Column>
      </Column>
    </form>
  );
}

/** A fieldset with an icon-badge heading that eases in as it scrolls into view. */
function FormSection({ icon, title, children }: { icon: IconName; title: string; children: ReactNode }) {
  return (
    <Reveal>
      <Column as="fieldset" fillWidth gap="16" margin="0" padding="0" style={{ border: 0, minWidth: 0 }}>
        <Row gap="8" vertical="center">
          <Row center width="32" height="32" radius="m" background="brand-alpha-weak" border="brand-alpha-medium">
            <Icon name={icon} size="xs" onBackground="brand-medium" />
          </Row>
          <Text as="h2" variant="label-strong-m" onBackground="neutral-strong">
            {title}
          </Text>
        </Row>
        {children}
      </Column>
    </Reveal>
  );
}
