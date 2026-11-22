"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { getAffiliateCopy, type AffiliateFaqCategory } from "@/i18n/affiliates";
import styles from "@/app/affiliates/Affiliates.module.css";

const CATEGORY_ORDER: ReadonlyArray<AffiliateFaqCategory> = [
  "all",
  "payouts",
  "security",
  "rules",
];

export default function AffiliateFaq() {
  const { locale } = useLanguage();
  const copy = getAffiliateCopy(locale);
  const [activeCategory, setActiveCategory] = useState<AffiliateFaqCategory>("all");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" aria-labelledby="faq-heading" className={styles.infoSection}>
      <h2 id="faq-heading" className={styles.sectionTitle}>
        {copy.faqTitle}
      </h2>

      <div
        className={styles.faqCategoryRow}
        role="group"
        aria-label={copy.faqCategoryAria}
      >
        {CATEGORY_ORDER.map((cat) => (
          <button
            key={cat}
            type="button"
            aria-pressed={activeCategory === cat}
            onClick={() => setActiveCategory(cat)}
            className={`${styles.filterBtn} ${
              activeCategory === cat ? styles.filterBtnActive : ""
            }`}
          >
            {copy.faqCategories[cat]}
          </button>
        ))}
      </div>

      {/* All 9 buttons remain mounted in the DOM so #faq button[aria-expanded] E2E contract stays intact */}
      <div className={styles.faqList}>
        {copy.faqItems.map((item, idx) => {
          const isOpen = openIndex === idx;
          const matchesCategory = activeCategory === "all" || item.category === activeCategory;
          const panelId = `affiliate-faq-panel-${idx}`;
          const btnId = `affiliate-faq-btn-${idx}`;

          return (
            <div
              key={idx}
              className={`${styles.faqItem} ${!matchesCategory ? styles.faqItemHidden : ""}`}
            >
              <h3 className={styles.faqQuestionHeading}>
                <button
                  id={btnId}
                  type="button"
                  className={styles.faqTrigger}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                >
                  <span>{item.question}</span>
                  <ChevronDown
                    size={18}
                    aria-hidden="true"
                    className={`${styles.faqChevron} ${isOpen ? styles.faqChevronOpen : ""}`}
                  />
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={btnId}
                className={`${styles.faqAnswerCollapse} ${
                  isOpen ? styles.faqAnswerCollapseOpen : ""
                }`}
              >
                <div className={styles.faqAnswerInner}>
                  <p className={styles.faqAnswerText}>{item.answer}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
