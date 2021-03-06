const express = require('express');
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/Users');
const Post = require('../../models/Post');
const { check, validationResult } = require('express-validator');
const config = require('config');
const axios = require('axios');
//to make proper url
const normalize = require('normalize-url');

//helps create router handlers
const router = express.Router();

//@route GET api/profile
//@desc Get currrent users profile
//@access private
router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);
        if(!profile){
            return res.status(400).json({ msg: 'There is no profile for this user' });
        }
        res.json(profile)

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

//@route GET api/profile
//@desc Create or Update users profile
//@access private
router.post('/', [auth, [
    check('status', 'Status is required').not().isEmpty(),
    check('skills', 'Skills is required').not().isEmpty()
]],
    async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({ errors: errors.array() });
        }
        const{ company, website, location, bio, status, githubusername, skills, youtube, facebook, instagram, twitter, linkedin } = req.body;

        //Build profile object
        const profileFields = {
            user: req.user.id,
            company,
            location,
            website: website === '' ? '' : normalize(website, { forceHttps: true }),
            bio,
            skills: Array.isArray(skills)
                ? skills
                : skills.split(',').map(skill => ' ' + skill.trim()),
            status,
            githubusername
        };

          // Build social object and add to profileFields
        const socialfields = { youtube, twitter, instagram, linkedin, facebook };
        
            for (const [key, value] of Object.entries(socialfields)) {
            if (value.length > 0)
                socialfields[key] = normalize(value, { forceHttps: true });
        }
        profileFields.social = socialfields;

        try {
            let profile = await Profile.findOne({ user: req.user.id });
            if(profile){
                //Update profile
                profile = await Profile.findOneAndUpdate(
                    { user: req.user.id },
                    { $set: profileFields },
                    { new: true }
                    );
                return res.json(profile)
            }
            // Create profile
            profile = new Profile(profileFields)
            await profile.save()
            res.json(profile)

        } catch (error) {
            console.error(error.message);
            res.status(500).send('Server Error');
        }
    }
);

//@route GET api/profile
//@desc Get all profiles
//@access public
router.get('/', async (req, res) => {
    try {
        //get all user profiles with name & avatar
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profiles);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Serevr Error');
    }
});

//@route GET api/profile/user/:user_id
//@desc Get profile by user ID
//@access public
router.get('/user/:user_id', async (req, res) => {
    try {
        //get user profile by ID with name & avatar
        const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);
        if(!profile){
            return res.status(400).json({ msg: 'Profile not found' })
        }
        res.json(profile);
    } catch (error) {
        console.error(error.message);
        if(error.kind === 'ObjectId'){
            return res.status(400).json({ msg: 'Profile not found' })
        }
        res.status(500).send('Server Error');
    }
});

//@route DELETE api/profile
//@desc Delete profile, user, posts
//@access private
router.delete('/', auth, async (req, res) => {
    try {
        //Delete user post
        await Post.deleteMany({ user: req.user.id });
        //Delete profile
        await Profile.findOneAndRemove({ user: req.user.id });
        //Delete user
        await User.findOneAndRemove({ _id: req.user.id });
        res.json({ msg: 'User Deleted' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Serevr Error');
    }
});

//@route PUT api/profile/experience
//@desc Add profile experience
//@access private
router.put('/experience', [auth, [
    check('title', 'Title is required').not().isEmpty(),
    check('company', 'Company is required').not().isEmpty(),
    check('from', 'From date is required').not().isEmpty()
    
]], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }
    const { title, company, location, from, to, current, description } = req.body;
    
    const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    }
    try {
        //find user and add experience with most recent at top
        const profile = await Profile.findOne({ user: req.user.id });
        profile.experience.unshift(newExp);
        await profile.save();
        res.json(profile)
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

//@route DELETE api/profile/experience/:exp_id
//@desc Delete experience from profile
//@access private
router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        
        //Get remove index by matching id
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);
        profile.experience.splice(removeIndex, 1);
        await profile.save();
        res.json(profile);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

//@route PUT api/profile/education
//@desc Add profile education
//@access private
router.put('/education', [auth, [
    check('school', 'School is required').not().isEmpty(),
    check('degree', 'Degree is required').not().isEmpty(),
    check('fieldofstudy', 'Field of study is required').not().isEmpty(),
    check('from', 'From date is required').not().isEmpty()
    
]], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array() });
    }
    const { school, degree, fieldofstudy, from, to, current, description } = req.body;
    
    const newEdu = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    }
    try {
        //find user and add experience with most recent at top
        const profile = await Profile.findOne({ user: req.user.id });
        profile.education.unshift(newEdu);
        await profile.save();
        res.json(profile)
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server Error');
    }
});

//@route DELETE api/profile/education/:edu_id
//@desc Delete education from profile
//@access private
router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        
        //Get remove index by matching id
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);
        profile.education.splice(removeIndex, 1);
        await profile.save();
        res.json(profile);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

//@route GET api/profile/github/:username
//@desc get user repos from github
//@access public
router.get('/github/:username', async (req, res) => {
    try {
        //Request URL
        const uri = encodeURI(
            `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc`
        );
        const headers = {
            'user-agent': 'node.js',
            Authorization: `token ${config.get('githubToken')}`
        };
        //Request & Response
        const gitHubResponse = await axios.get(uri, { headers });
        return res.json(gitHubResponse.data);

    } catch(error) {
        console.error(error.message);
        return res.status(404).json({ msg: 'No Github profile found' });
    }
})
module.exports = router;