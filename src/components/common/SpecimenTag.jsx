/**
 * SpecimenTag — loyihaning signature komponenti.
 * Namuna ID (CHEM-2026-00001) va CAS raqamlarini oddiy matn sifatida emas,
 * laboratoriya idishiga yopishtiriladigan yorliq ko'rinishida ko'rsatadi:
 * mono shrift + chap tomonda toifa rangidagi tasma.
 *
 * tone: 'teal' | 'amber' | 'red' | 'blue' | 'slate'
 */
export default function SpecimenTag({ children, tone = 'teal' }) {
  return (
    <span className={`specimen-tag specimen-tag--${tone}`}>
      <span className="specimen-tag__tab" />
      <span className="specimen-tag__label">{children}</span>
    </span>
  );
}
