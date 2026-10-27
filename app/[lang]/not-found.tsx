import { Button, Column, Icon, Row } from "@once-ui-system/core";
import { lang as getLang } from "next/root-params";
import { SectionTitle } from "@/components/SectionTitle";
import { defaultLocale, hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function NotFound() {
  const value = await getLang();
  const lang = value && hasLocale(value) ? value : defaultLocale;
  const dict = await getDictionary(lang);

  return (
    <Column fillWidth flex={1} center gap="16" paddingX="24" paddingY="104" align="center">
      <Row
        className="anim-rise wiggle"
        center
        width="64"
        height="64"
        radius="full"
        background="accent-alpha-weak"
        border="accent-alpha-medium"
      >
        <Icon name="palette" size="l" onBackground="accent-medium" />
      </Row>
      <SectionTitle
        as="h1"
        align="center"
        trigger="load"
        title={dict.notFound.title}
        highlight={dict.notFound.titleHighlight}
        description={dict.notFound.body}
      >
        <Button href={`/${lang}`} variant="secondary" prefixIcon="home">
          {dict.notFound.back}
        </Button>
      </SectionTitle>
    </Column>
  );
}
