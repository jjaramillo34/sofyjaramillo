import type { IconComponent } from "@once-ui-system/core";
import {
  ArrowRight,
  ArrowUpRight,
  AtSign,
  Brush,
  Calendar,
  CalendarHeart,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  CircleCheck,
  Copy,
  Eye,
  Flower2,
  Footprints,
  Globe,
  Heart,
  House,
  ImageIcon,
  Images,
  Languages,
  Link,
  Mail,
  MapPin,
  MessageCircleHeart,
  MoonStar,
  Paintbrush,
  Palette,
  Pause,
  PenTool,
  Play,
  Ruler,
  Search,
  Send,
  Share2,
  Shirt,
  Sparkle,
  Sparkles,
  Upload,
  User,
  Wallet,
  WandSparkles,
  X,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";
import { siFacebook, siInstagram, siPinterest, siWhatsapp, siX, type SimpleIcon } from "simple-icons";

/**
 * Once UI renders registered icons with no props and sizes them by font-size,
 * so each Lucide icon is drawn at 1em with a slightly softer stroke.
 */
function lucide(Icon: LucideIcon): IconComponent {
  const Wrapped = (props: React.SVGProps<SVGSVGElement>) => (
    <Icon size="1em" strokeWidth={1.75} aria-hidden="true" {...(props as LucideProps)} />
  );
  Wrapped.displayName = `Lucide(${Icon.displayName ?? "Icon"})`;
  return Wrapped;
}

/** Brand marks (Lucide dropped brand icons in v1): Simple Icons paths, drawn in currentColor. */
function brand(icon: SimpleIcon): IconComponent {
  const Brand = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" {...props}>
      <path d={icon.path} />
    </svg>
  );
  Brand.displayName = `Brand(${icon.title})`;
  return Brand;
}

/**
 * Every icon on the site comes from Lucide, except the brand marks below. Built-in Once UI names (close,
 * chevronDown, check…) are overridden too, so components like Select and
 * Dialog match the rest of the iconography.
 */
export const icons = {
  // Overrides of Once UI built-ins
  arrowRight: lucide(ArrowRight),
  arrowUpRight: lucide(ArrowUpRight),
  calendar: lucide(Calendar),
  check: lucide(Check),
  chevronDown: lucide(ChevronDown),
  chevronLeft: lucide(ChevronLeft),
  chevronRight: lucide(ChevronRight),
  chevronUp: lucide(ChevronUp),
  close: lucide(X),
  copy: lucide(Copy),
  danger: lucide(CircleAlert),
  eye: lucide(Eye),
  globe: lucide(Globe),
  heart: lucide(Heart),
  home: lucide(House),
  image: lucide(ImageIcon),
  link: lucide(Link),
  mail: lucide(Mail),
  pause: lucide(Pause),
  person: lucide(User),
  play: lucide(Play),
  search: lucide(Search),
  send: lucide(Send),
  share: lucide(Share2),
  sparkle: lucide(Sparkle),
  upload: lucide(Upload),

  // Studio icons
  at: lucide(AtSign),
  brush: lucide(Brush),
  calendarHeart: lucide(CalendarHeart),
  circleCheck: lucide(CircleCheck),
  flower: lucide(Flower2),
  footprints: lucide(Footprints),
  gallery: lucide(Images),
  languages: lucide(Languages),
  mapPin: lucide(MapPin),
  messageHeart: lucide(MessageCircleHeart),
  moonStar: lucide(MoonStar),
  paintbrush: lucide(Paintbrush),
  palette: lucide(Palette),
  penTool: lucide(PenTool),
  ruler: lucide(Ruler),
  shirt: lucide(Shirt),
  sparkles: lucide(Sparkles),
  wallet: lucide(Wallet),
  wand: lucide(WandSparkles),

  // Brands, for share buttons and social links
  facebook: brand(siFacebook),
  instagram: brand(siInstagram),
  pinterest: brand(siPinterest),
  whatsapp: brand(siWhatsapp),
  x: brand(siX),
} satisfies Record<string, IconComponent>;

type StudioIconNames = { [K in keyof typeof icons]: true };

// Registers the names above in Once UI's IconName union, so
// <Icon name="palette" /> and prefixIcon="shirt" are type-checked.
declare module "@once-ui-system/core" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface IconLibraryOverrides extends StudioIconNames {}
}
