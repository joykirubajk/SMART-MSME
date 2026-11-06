import Scheme from '../models/scheme.js';
import { normalizeProfile, missingRequiredFields } from '../services/eligibilityEngine.js';
import { recommend } from '../services/recommendationService.js';
import Profile from '../models/profile.js';
import { validateProfile } from '../utils/validate.js';
import { fail } from '../utils/response.js';

// Controller for recommending schemes. Requires login.
// Body: { profile?: {...}, save_profile?: boolean }. Without `profile`, the user's saved profile is used.
// Returns eligible + possibly-eligible schemes ordered by ranking score (desc); each carries `tier`, `score`,
// `reasons` and `eligibility` (passedRules / unknownRules / missingInputs). `ranked_by` is 'ml' (Python service)
// or 'fallback' (deterministic scorer). Not-eligible schemes are never returned.
const recommendSchemes = async (req, res, next) => {
    try {
        const { profile: provided, save_profile: saveProfile } = req.body || {};
        let profileInput;

        if (provided !== undefined && provided !== null) {
            const { value, errors } = validateProfile(provided);
            if (errors.length > 0) {
                return fail(res, 400, 'Invalid profile', errors);
            }
            profileInput = value;
            if (saveProfile === true) {
                await Profile.upsert(req.user.id, value);
            }
        } else {
            profileInput = await Profile.findByUserId(req.user.id);
            if (!profileInput) {
                return fail(res, 400, 'No profile provided and no saved profile found');
            }
        }

        const profile = normalizeProfile(profileInput);

        const missing = missingRequiredFields(profile);
        if (missing.length > 0) {
            return fail(res, 400, 'Missing or invalid profile fields', missing.map((field) => ({
                field,
                message: `${field} is required`
            })));
        }

        const schemes = await Scheme.findAll();
        const byId = new Map(schemes.map((s) => [s.id, s]));
        const ranked = await recommend(profile, schemes);

        const data = ranked.results.map((r) => ({
            ...byId.get(r.schemeId),
            tier: r.tier,
            score: r.score,
            reasons: r.reasons,
            eligibility: r.eligibility
        }));

        res.json({
            success: true,
            count: data.length,
            eligible_count: ranked.results.filter((r) => r.tier === 'eligible').length,
            possible_count: ranked.results.filter((r) => r.tier === 'possibly_eligible').length,
            ranked_by: ranked.ranked_by,
            model_version: ranked.model_version,
            data
        });
    } catch (error) {
        next(error);
    }
};

// Get all schemes
const getAllSchemes = async (req, res) => {
    try {
        const schemes = await Scheme.findAll();
        res.json({
            success: true,
            data: schemes
        });
    } catch (error) {
        console.error('Error fetching schemes:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};


export { recommendSchemes, getAllSchemes };