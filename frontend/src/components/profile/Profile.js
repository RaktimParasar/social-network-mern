import React, { Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { getProfileById } from '../../actions/profile';
import Spinner from '../layout/Spinner';
import { Link } from 'react-router-dom';

const Profile = ({ match, getProfileById, auth, profile: { profile, loading } }) => {
    
    useEffect(() => {
        getProfileById(match.params.id);
    }, [getProfileById, match.params.id]);

    return (
        <Fragment>
            <section className="container">
            {
                profile === null || loading ? <Spinner /> : <Fragment>
                    <Link to='/profiles' className="btn btn-light">Back To Profiles</Link>
                    {
                        auth.isAuthenticated && auth.loading === false && auth.user._id === profile.user._id && (<Link to='/edit-profile' className="btn btn-dark">
                            Edit Profile
                        </Link>)
                    }
                </Fragment>
            }
            </section>
        </Fragment>
    )
}

Profile.propTypes = {
    getProfileById: PropTypes.func.isRequired,
    auth: PropTypes.object.isRequired,
    profile: PropTypes.object.isRequired,
};

const mapStateToProps = state => ({
    auth: state.auth,
    profile: state.profile
})

export default connect(mapStateToProps, { getProfileById })(Profile)