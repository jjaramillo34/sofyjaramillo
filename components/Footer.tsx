import { Button, Column, Icon, Row, Text } from "@once-ui-system/core";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

type FooterProps = {
  footer: Dictionary["footer"];
  instagram: string | null;
  email: string;
};

export function Footer({ footer, instagram, email }: FooterProps) {
  return (
    <Row as="footer" fillWidth horizontal="center" paddingX="24" paddingY="40" borderTop>
      <Row
        maxWidth="l"
        horizontal="between"
        vertical="center"
        gap="16"
        s={{ direction: "column", horizontal: "center" }}
      >
        <Column gap="4" s={{ horizontal: "center" }}>
          <Row gap="8" vertical="center" textVariant="label-strong-m" onBackground="neutral-strong">
            {footer.madeIn}
            <Icon name="heart" size="xs" onBackground="accent-medium" />
          </Row>
          <Text variant="body-default-xs" onBackground="neutral-weak">
            {footer.rights}
          </Text>
        </Column>
        <Row gap="8">
          {instagram && (
            <Button href={instagram} variant="tertiary" size="s" prefixIcon="instagram" suffixIcon="arrowUpRight">
              Instagram
            </Button>
          )}
          {email && (
            <Button href={`mailto:${email}`} variant="tertiary" size="s" prefixIcon="mail">
              {email}
            </Button>
          )}
        </Row>
      </Row>
    </Row>
  );
}
