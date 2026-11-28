import { MEMBERSHIP_TIER_NAME_MAP } from '../lib/clubPricing';
import type { MembershipTier } from '../types/domain';

interface ClubTierWaveChipProps {
  tier: Exclude<MembershipTier, 'none'>;
}

const TIER_WAVE_ICON_URL =
  'https://www.gstatic.com/identity/boq/accountsettingsmobile/tier_wave_4d15c88d26ad039061707f8af71fc76d.svg';

/**
 * Compact tier wave chip displaying the user's active Clube CAMBLU tier.
 */
export function ClubTierWaveChip({ tier }: ClubTierWaveChipProps) {
  return (
    <div className="kykVM club-tier-wave-chip" data-tier={tier} aria-hidden="true">
      <img src={TIER_WAVE_ICON_URL} className="oU5yj" alt="" role="presentation" />
      <span className="YzbLde">{MEMBERSHIP_TIER_NAME_MAP[tier]}</span>
    </div>
  );
}
