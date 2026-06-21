describe('TopToolbar E2E Tests', () => {
  const mockUser = {
    id: 1,
    login: 'cypress_user',
    email: 'cypress@example.com',
    display_name: 'Cypress Test User',
    gender: 'M',
    birthday: '1995-10-10',
    height_cm: 175,
    target_weight_kg: 70,
    profile_image_path: null,
    profile_image_url: null,
    preferred_language: 'en',
    created_at: '2026-06-20T10:00:00Z',
  };

  const mockSummary = {
    total_records: 0,
    first_record_date: null,
    latest_record_date: null,
    starting_weight: null,
    current_weight: null,
    weight_change: null,
    starting_body_fat: null,
    current_body_fat: null,
    body_fat_change: null,
    starting_body_fat_mass: null,
    current_body_fat_mass: null,
    body_fat_mass_change: null,
    starting_muscle_mass: null,
    current_muscle_mass: null,
    muscle_mass_change: null,
    starting_skeletal_muscle_mass: null,
    current_skeletal_muscle_mass: null,
    skeletal_muscle_mass_change: null,
    starting_skeletal_muscle_mass_pct: null,
    current_skeletal_muscle_mass_pct: null,
    skeletal_muscle_mass_pct_change: null,
    weight_history: [],
  };

  beforeEach(() => {
    // Intercept auth and summary calls
    cy.intercept('GET', '/api/users/me', {
      statusCode: 200,
      body: mockUser,
    }).as('getMe');

    cy.intercept('GET', '/api/records/summary', {
      statusCode: 200,
      body: mockSummary,
    }).as('getSummary');

    // Bypass login by setting auth token
    cy.window().then((win) => {
      win.localStorage.setItem('fitdays_token', 'mock_token');
    });

    cy.visit('/');
    cy.wait(['@getMe', '@getSummary']);
  });

  it('displays logo and correct links in toolbar', () => {
    cy.get('header').within(() => {
      // Branding check
      cy.contains('FitdaysWeb').should('be.visible');

      // GitHub Icon link
      cy.get('a[title="support us!"]')
        .should('have.attr', 'href', 'https://github.com/cfassoni/FitdaysWeb')
        .and('have.attr', 'target', '_blank');

      // Bug Icon link
      cy.get('a[title="report bug"]')
        .should('have.attr', 'href', 'https://github.com/cfassoni/FitdaysWeb/issues')
        .and('have.attr', 'target', '_blank');
    });
  });

  it('interacts with the UserMenu and navigates to Profile', () => {
    // Dropdown is not visible initially
    cy.get('[role="menu"]').should('not.exist');

    // Click on avatar button
    cy.get('header button[aria-label="User profile menu"]').click();

    // Check menu is open
    cy.get('[role="menu"]')
      .should('be.visible')
      .within(() => {
        cy.contains('Cypress Test User').should('be.visible');
        cy.contains('cypress@example.com').should('be.visible');
        
        // Click Edit Profile
        cy.contains('Edit Profile').click();
      });

    // Verify view changed (main contents has profile header or URL/view changes)
    cy.get('main').within(() => {
      cy.contains('User Profile Settings').should('be.visible');
    });
  });

  it('toggles mobile sidebar navigation drawer', () => {
    // Set mobile viewport
    cy.viewport('iphone-6');

    // Hamburger button should be visible
    cy.get('header button[aria-label="Toggle navigation menu"]').should('be.visible');

    // Drawer should not be visible
    cy.contains('Navigation').should('not.exist');

    // Open drawer
    cy.get('header button[aria-label="Toggle navigation menu"]').click();

    // Drawer should be open
    cy.contains('Navigation').should('be.visible');

    // Click Close button
    cy.get('button[aria-label="Close menu"]').click();

    // Drawer should be closed
    cy.contains('Navigation').should('not.exist');
  });
});
