# Use email as user identification for login, retiring username

## Summary

Transition the authentication system to use email as the primary user identifier for login instead of username. This is a significant change that may impact the existing API and require careful evaluation of breaking changes.

## Description

Currently, the application uses username for user identification during login. This issue proposes migrating to email-based authentication where:
- Email becomes the unique user identifier for login
- Username is either retired or repurposed (non-login related)
- Existing users with current usernames need to be migrated

## Impact Assessment

This change **may introduce breaking changes** to the API:
- Login endpoints will need to change authentication parameters
- Existing API clients using username authentication will be affected
- Database schema may require adjustments
- User data migration strategy needed

## Tasks

- [ ] Evaluate current API endpoints that depend on username authentication
- [ ] Document all affected endpoints and authentication flows
- [ ] Design migration strategy for existing users
- [ ] Plan backward compatibility or API versioning approach
- [ ] Update authentication logic to use email
- [ ] Migrate database schema if necessary
- [ ] Update API documentation
- [ ] Create migration script for existing user data
- [ ] Test authentication flows with email
- [ ] Coordinate API client updates

## Additional Context

Repository: cfassoni/FitdaysWeb
Priority: Requires API impact evaluation before implementation
