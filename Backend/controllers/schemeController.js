import Scheme from '../models/scheme.js';
import { evaluateAll, normalizeProfile, missingRequiredFields } from '../services/eligibilityEngine.js';
import Profile from '../models/profile.js';
import { validateProfile } from '../utils/validate.js';
import { fail } from '../utils/response.js';

// Controller for recommending schemes. Requires login.
// Body: { profile?: {...}, save_profile?: boolean }. Without `profile`, the user's saved profile is used.
// Returns eligible + possibly-eligible schemes (eligible first); each carries `tier` and `eligibility`
// (passedRules / unknownRules / missingInputs). Not-eligible schemes are never returned.
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
        const results = evaluateAll(profile, schemes);

        const data = results.map((r) => ({
            ...byId.get(r.schemeId),
            tier: r.tier,
            eligibility: {
                passedRules: r.passedRules,
                unknownRules: r.unknownRules,
                missingInputs: r.missingInputs
            }
        }));

        res.json({
            success: true,
            count: data.length,
            eligible_count: results.filter((r) => r.tier === 'eligible').length,
            possible_count: results.filter((r) => r.tier === 'possibly_eligible').length,
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