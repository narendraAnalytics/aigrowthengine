import Image from "next/image";
import { IMAGES } from "@/lib/site";
import { AuthCtaButton } from "@/components/auth/auth-cta-button";
import { Icon } from "./icons";
import { Reveal } from "./reveal";

export function CtaBanner() {
  return (
    <section className="px-4 pb-[clamp(3rem,7vw,5.5rem)] sm:px-6 lg:px-14">
      <Reveal className="glass-panel mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-6 rounded-3xl p-7 sm:p-10">
        <div className="flex items-center gap-5">
          <Image
            src={IMAGES.logo}
            alt=""
            width={52}
            height={52}
            className="size-13 shrink-0 object-contain"
          />
          <div>
            <h2 className="font-heading text-[clamp(1.25rem,2.6vw,1.75rem)] font-bold text-cream">
              Ready to Unlock Your{" "}
              <span className="text-gradient-gold">Growth Potential?</span>
            </h2>
            <p className="mt-1.5 max-w-md text-[0.9rem] text-muted-warm">
              Start your free assessment today and discover how AI can transform
              your business.
            </p>
          </div>
        </div>
        <AuthCtaButton
          signedInHref="/business-assessment"
          className="btn-gold inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-[0.95rem] font-bold whitespace-nowrap transition hover:-translate-y-0.5"
        >
          Start Your Free Assessment
          <Icon.arrowRight className="size-4" />
        </AuthCtaButton>
      </Reveal>
    </section>
  );
}
