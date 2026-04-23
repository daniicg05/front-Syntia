import { Button } from "./Button";
import { Card } from "./Card";

interface PricingCardProps {
  title: string;
  price: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
  onSelect?: () => void;
}

export function PricingCard({
  title,
  price,
  features,
  highlighted = false,
  cta,
  onSelect,
}: PricingCardProps) {
  return (
    <Card
      padding="md"
      className={`
        relative flex flex-col justify-between w-full max-w-[320px] h-120 transition-all duration-300
        ${highlighted 
          ? "border-2 border-primary bg-primary-light shadow-sm hover:shadow-2xl scale-105 z-10" 
          : "border border-border hover:shadow-xl"
        }
      `}
    >
      {/* 🔥 Badge */}
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-bold tracking-wider shadow">
            Más recomendado
          </span>
        </div>
      )}

      <div>
        {/* Header */}
        <div className="mt-4 text-center">
          <p
            className={`
              text-xs font-semibold uppercase tracking-wider
              ${highlighted ? "text-primary" : "text-foreground-subtle"}
            `}
          >
            {title}
          </p>

          <h3
            className={`
              text-2xl font-bold mt-2
              ${highlighted ? "text-primary" : "text-foreground"}
            `}
          >
            {price}
          </h3>
        </div>

        {/* Features */}
        <ul className="mt-8 space-y-3 mb-6">
          {features.map((f, i) => (
            <li
              key={i}
              className="text-sm text-foreground-muted flex items-start gap-3"
            >
              <span
                className={`
                  w-5 h-5 rounded-md inline-flex items-center justify-center text-xs
                  ${highlighted 
                    ? "bg-primary text-white" 
                    : "bg-primary-light text-primary"
                  }
                `}
              >
                ✓
              </span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="mt-4">
        <Button
          variant={highlighted ? "primary" : "secondary"}
          size="md"
          onClick={onSelect}
          className={`
            w-full cursor-pointer transition-all
            ${highlighted ? "shadow-md hover:scale-[1.02]" : ""}
          `}
        >
          {cta}
        </Button>
      </div>
    </Card>
  );
}