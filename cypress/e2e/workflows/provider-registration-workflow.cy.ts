describe('Complete consignor Registration and Approval Workflow', () => {
  const testData = {
    owner: {
      fullName: 'Workflow Test Owner',
      email: `workflow-owner-${Date.now()}@testshop.com`,
      password: 'TestPassword123!',
      shopName: 'Workflow Test Shop',
      phone: '555-111-2222'
    },
    consignor: {
      fullName: 'Workflow Test consignor',
      email: `workflow-consignor-${Date.now()}@testshop.com`,
      password: 'TestPassword123!',
      phone: '555-333-4444',
      preferredPaymentMethod: 'Venmo',
      paymentDetails: '@workflowprovider'
    },
    admin: {
      email: 'admin@demoshop.com',
      password: 'Admin123!'
    }
  };

  let storeCode: string;

  before(() => {
    // Clean up any existing test data
    cy.task('cleanupTestData', {
      emails: [testData.owner.email, testData.consignor.email]
    }, { timeout: 10000 }).then(() => {
      cy.log('Test data cleanup completed');
    });
  });

  after(() => {
    // Clean up test data after completion
    cy.task('cleanupTestData', {
      emails: [testData.owner.email, testData.consignor.email]
    }, { timeout: 10000 });
  });

  describe('Phase 1: Owner Registration and Approval', () => {
    it('should allow owner to register successfully', () => {
      cy.visit('/register/owner');

      // Fill out owner registration form
      cy.get('input[name="fullName"]').type(testData.owner.fullName);
      cy.get('input[name="email"]').type(testData.owner.email);
      cy.get('input[name="phone"]').type(testData.owner.phone);
      cy.get('input[name="password"]').type(testData.owner.password);
      cy.get('input[name="confirmPassword"]').type(testData.owner.password);
      cy.get('input[name="shopName"]').type(testData.owner.shopName);

      cy.get('button[type="submit"]').click();

      // Should redirect to success page
      cy.url().should('include', '/register/success');
      cy.get('h1').should('contain', 'Account Created!');
      cy.get('.success-content').should('contain', testData.owner.fullName.split(' ')[0]);
      cy.get('.success-content').should('contain', testData.owner.shopName);
    });

    it('should prevent login for pending owner', () => {
      cy.visit('/login');

      cy.get('input[name="email"]').type(testData.owner.email);
      cy.get('input[name="password"]').type(testData.owner.password);
      cy.get('button[type="submit"]').click();

      // Should show pending approval message
      cy.get('.error-message').should('be.visible');
      cy.get('.error-message').should('contain', 'pending');
      cy.url().should('include', '/login');
    });

    it('should allow admin to approve owner', () => {
      // Login as admin
      cy.visit('/login');
      cy.get('input[name="email"]').type(testData.admin.email);
      cy.get('input[name="password"]').type(testData.admin.password);
      cy.get('button[type="submit"]').click();

      // Navigate to admin dashboard
      cy.url().should('include', '/admin');
      cy.get('.admin-nav').should('be.visible');

      // Check pending owners list
      cy.get('[data-cy="pending-owners"]').should('be.visible');
      cy.get('[data-cy="pending-owners"]').should('contain', testData.owner.fullName);
      cy.get('[data-cy="pending-owners"]').should('contain', testData.owner.shopName);

      // Approve the owner
      cy.get('[data-cy="approve-owner-btn"]').last().click();

      // Should show success message
      cy.get('.success-message').should('contain', 'Owner approved successfully');

      // Store code should be generated and displayed
      cy.get('.store-code-display').should('be.visible');
      cy.get('.store-code-display').invoke('text').then((text) => {
        storeCode = text.match(/\d{4}/)[0];
        expect(storeCode).to.match(/^\d{4}$/);
        cy.log(`Generated store code: ${storeCode}`);
      });

      // Logout admin
      cy.get('[data-cy="logout-btn"]').click();
    });

    it('should allow approved owner to login', () => {
      cy.visit('/login');

      cy.get('input[name="email"]').type(testData.owner.email);
      cy.get('input[name="password"]').type(testData.owner.password);
      cy.get('button[type="submit"]').click();

      // Should successfully login and redirect to owner dashboard
      cy.url().should('include', '/owner');
      cy.get('.dashboard-header').should('contain', testData.owner.fullName);

      // Store code should be visible in settings
      cy.get('[data-cy="store-settings"]').click();
      cy.get('[data-cy="current-store-code"]').should('contain', storeCode);

      // Logout owner
      cy.get('[data-cy="logout-btn"]').click();
    });
  });

  describe('Phase 2: consignor Registration with Generated Store Code', () => {
    it('should validate the generated store code', () => {
      cy.visit('/register/consignor');

      // Enter the generated store code
      cy.get('input[name="storeCode"]').type(storeCode);
      cy.get('button[type="submit"]').click();

      // Should validate successfully
      cy.get('.bg-green-50').should('be.visible');
      cy.get('.bg-green-50').should('contain', 'Store Code Validated');
      cy.get('.bg-green-50').should('contain', testData.owner.shopName);

      // Registration form should be visible
      cy.get('[data-cy="registration-form"]').should('be.visible');
    });

    it('should allow consignor to complete registration', () => {
      // Fill out consignor registration form
      cy.get('input[name="fullName"]').type(testData.consignor.fullName);
      cy.get('input[name="email"]').type(testData.consignor.email);
      cy.get('input[name="phone"]').type(testData.consignor.phone);
      cy.get('input[name="password"]').type(testData.consignor.password);
      cy.get('select[name="preferredPaymentMethod"]').select(testData.consignor.preferredPaymentMethod);
      cy.get('input[name="paymentDetails"]').type(testData.consignor.paymentDetails);

      cy.get('button[type="submit"]').click();

      // Should redirect to success page
      cy.url().should('include', '/register/success');
      cy.get('h1').should('contain', 'Account Created!');
      cy.get('.success-content').should('contain', testData.consignor.fullName.split(' ')[0]);
      cy.get('.success-content').should('contain', testData.owner.shopName);
    });

    it('should prevent login for pending consignor', () => {
      cy.visit('/login');

      cy.get('input[name="email"]').type(testData.consignor.email);
      cy.get('input[name="password"]').type(testData.consignor.password);
      cy.get('button[type="submit"]').click();

      // Should show pending approval message
      cy.get('.error-message').should('be.visible');
      cy.get('.error-message').should('contain', 'pending');
      cy.url().should('include', '/login');
    });
  });

  describe('Phase 3: consignor Approval by Owner', () => {
    it('should show pending consignor to owner', () => {
      // Login as owner
      cy.visit('/login');
      cy.get('input[name="email"]').type(testData.owner.email);
      cy.get('input[name="password"]').type(testData.owner.password);
      cy.get('button[type="submit"]').click();

      // Navigate to consignor management
      cy.get('[data-cy="consignor-management"]').click();
      cy.url().should('include', '/owner/consignors');

      // Check pending consignors list
      cy.get('[data-cy="pending-consignors"]').should('be.visible');
      cy.get('[data-cy="pending-consignors"]').should('contain', testData.consignor.fullName);
      cy.get('[data-cy="pending-consignors"]').should('contain', testData.consignor.email);

      // Should show payment preferences
      cy.get('[data-cy="pending-consignors"]').should('contain', testData.consignor.preferredPaymentMethod);
    });

    it('should allow owner to approve consignor', () => {
      // Approve the consignor
      cy.get('[data-cy="approve-consignor-btn"]').last().click();

      // Should show confirmation dialog
      cy.get('[data-cy="confirm-approval"]').should('be.visible');
      cy.get('[data-cy="confirm-approval"]').should('contain', testData.consignor.fullName);
      cy.get('[data-cy="confirm-approve-btn"]').click();

      // Should show success message
      cy.get('.success-message').should('contain', 'consignor approved successfully');

      // consignor should move to approved list
      cy.get('[data-cy="approved-consignors"]').should('be.visible');
      cy.get('[data-cy="approved-consignors"]').should('contain', testData.consignor.fullName);

      // Logout owner
      cy.get('[data-cy="logout-btn"]').click();
    });

    it('should allow approved consignor to login', () => {
      cy.visit('/login');

      cy.get('input[name="email"]').type(testData.consignor.email);
      cy.get('input[name="password"]').type(testData.consignor.password);
      cy.get('button[type="submit"]').click();

      // Should successfully login and redirect to consignor dashboard
      cy.url().should('include', '/consignor');
      cy.get('.dashboard-header').should('contain', testData.consignor.fullName);

      // Should see consignor-specific dashboard content
      cy.get('[data-cy="consignor-dashboard"]').should('be.visible');
      cy.get('[data-cy="my-items"]').should('be.visible');
      cy.get('[data-cy="earnings-summary"]').should('be.visible');

      // Should show connected shop information
      cy.get('[data-cy="shop-info"]').should('contain', testData.owner.shopName);

      // Logout consignor
      cy.get('[data-cy="logout-btn"]').click();
    });
  });

  describe('Phase 4: Workflow Verification', () => {
    it('should show correct consignor count in owner dashboard', () => {
      // Login as owner
      cy.visit('/login');
      cy.get('input[name="email"]').type(testData.owner.email);
      cy.get('input[name="password"]').type(testData.owner.password);
      cy.get('button[type="submit"]').click();

      // Check dashboard stats
      cy.get('[data-cy="consignor-count"]').should('contain', '1');
      cy.get('[data-cy="active-consignors"]').should('contain', '1');

      // consignor should be listed in active consignors
      cy.get('[data-cy="consignor-management"]').click();
      cy.get('[data-cy="approved-consignors"]').should('contain', testData.consignor.fullName);

      cy.get('[data-cy="logout-btn"]').click();
    });

    it('should show consignor details correctly in owner view', () => {
      // Login as owner
      cy.visit('/login');
      cy.get('input[name="email"]').type(testData.owner.email);
      cy.get('input[name="password"]').type(testData.owner.password);
      cy.get('button[type="submit"]').click();

      cy.get('[data-cy="consignor-management"]').click();

      // Click on consignor details
      cy.get('[data-cy="view-consignor-details"]').last().click();

      // Should show full consignor information
      cy.get('[data-cy="consignor-details"]').should('be.visible');
      cy.get('[data-cy="consignor-details"]').should('contain', testData.consignor.fullName);
      cy.get('[data-cy="consignor-details"]').should('contain', testData.consignor.email);
      cy.get('[data-cy="consignor-details"]').should('contain', testData.consignor.phone);
      cy.get('[data-cy="consignor-details"]').should('contain', testData.consignor.preferredPaymentMethod);
      cy.get('[data-cy="consignor-details"]').should('contain', testData.consignor.paymentDetails);

      cy.get('[data-cy="logout-btn"]').click();
    });

    it('should prevent unauthorized access to other user types', () => {
      // Try to access admin area as consignor
      cy.visit('/login');
      cy.get('input[name="email"]').type(testData.consignor.email);
      cy.get('input[name="password"]').type(testData.consignor.password);
      cy.get('button[type="submit"]').click();

      cy.visit('/admin', { failOnStatusCode: false });
      cy.url().should('include', '/unauthorized');

      // Try to access owner area as consignor
      cy.visit('/owner', { failOnStatusCode: false });
      cy.url().should('include', '/unauthorized');

      cy.get('[data-cy="logout-btn"]').click();
    });

    it('should maintain correct user roles after approval', () => {
      // Verify owner still has owner role
      cy.visit('/login');
      cy.get('input[name="email"]').type(testData.owner.email);
      cy.get('input[name="password"]').type(testData.owner.password);
      cy.get('button[type="submit"]').click();

      cy.visit('/owner');
      cy.url().should('include', '/owner');
      cy.get('[data-cy="owner-dashboard"]').should('be.visible');

      cy.get('[data-cy="logout-btn"]').click();

      // Verify consignor has consignor role
      cy.visit('/login');
      cy.get('input[name="email"]').type(testData.consignor.email);
      cy.get('input[name="password"]').type(testData.consignor.password);
      cy.get('button[type="submit"]').click();

      cy.visit('/consignor');
      cy.url().should('include', '/consignor');
      cy.get('[data-cy="consignor-dashboard"]').should('be.visible');

      cy.get('[data-cy="logout-btn"]').click();
    });
  });

  describe('Phase 5: Integration with Existing Features', () => {
    it('should allow consignor to view items (when feature is available)', () => {
      cy.visit('/login');
      cy.get('input[name="email"]').type(testData.consignor.email);
      cy.get('input[name="password"]').type(testData.consignor.password);
      cy.get('button[type="submit"]').click();

      // If items feature exists, consignor should be able to access it
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy="my-items"]').length > 0) {
          cy.get('[data-cy="my-items"]').click();
          cy.url().should('include', '/consignor/items');
          cy.get('[data-cy="items-list"]').should('be.visible');
        }
      });

      cy.get('[data-cy="logout-btn"]').click();
    });

    it('should allow owner to manage consignor settings', () => {
      cy.visit('/login');
      cy.get('input[name="email"]').type(testData.owner.email);
      cy.get('input[name="password"]').type(testData.owner.password);
      cy.get('button[type="submit"]').click();

      // Check store code settings
      cy.get('[data-cy="store-settings"]').click();
      cy.get('[data-cy="current-store-code"]').should('be.visible');

      // Should be able to regenerate store code
      cy.get('[data-cy="regenerate-store-code"]').should('be.visible');

      // Should be able to toggle consignor auto-approval
      cy.get('[data-cy="auto-approve-consignors"]').should('be.visible');

      cy.get('[data-cy="logout-btn"]').click();
    });
  });
});

describe('Error Scenarios and Edge Cases', () => {
  const testData = {
    owner1: {
      fullName: 'Error Test Owner 1',
      email: `error-owner1-${Date.now()}@testshop.com`,
      password: 'TestPassword123!',
      shopName: 'Error Test Shop 1'
    },
    owner2: {
      fullName: 'Error Test Owner 2',
      email: `error-owner2-${Date.now()}@testshop.com`,
      password: 'TestPassword123!',
      shopName: 'Error Test Shop 2'
    },
    consignor: {
      fullName: 'Error Test consignor',
      email: `error-consignor-${Date.now()}@testshop.com`,
      password: 'TestPassword123!'
    }
  };

  it('should handle consignor registration with disabled store code', () => {
    // This test assumes there's a disabled store code for testing
    cy.visit('/register/consignor');

    cy.get('input[name="storeCode"]').type('0000'); // Assumed disabled code
    cy.get('button[type="submit"]').click();

    cy.get('.text-red-600').should('be.visible');
    cy.get('.text-red-600').should('contain', 'disabled');
    cy.get('[data-cy="registration-form"]').should('not.exist');
  });

  it('should handle network errors gracefully', () => {
    cy.intercept('GET', '**/auth/validate-store-code/**', { forceNetworkError: true }).as('networkError');

    cy.visit('/register/consignor');
    cy.get('input[name="storeCode"]').type('1234');
    cy.get('button[type="submit"]').click();

    cy.wait('@networkError');
    cy.get('.text-red-600').should('be.visible');
    cy.get('.text-red-600').should('contain', 'Unable to validate');
  });

  it('should prevent duplicate email registrations', () => {
    // Register first owner
    cy.visit('/register/owner');
    cy.get('input[name="fullName"]').type(testData.owner1.fullName);
    cy.get('input[name="email"]').type(testData.owner1.email);
    cy.get('input[name="password"]').type(testData.owner1.password);
    cy.get('input[name="confirmPassword"]').type(testData.owner1.password);
    cy.get('input[name="shopName"]').type(testData.owner1.shopName);
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/register/success');

    // Try to register second owner with same email
    cy.visit('/register/owner');
    cy.get('input[name="fullName"]').type(testData.owner2.fullName);
    cy.get('input[name="email"]').type(testData.owner1.email); // Same email
    cy.get('input[name="password"]').type(testData.owner2.password);
    cy.get('input[name="confirmPassword"]').type(testData.owner2.password);
    cy.get('input[name="shopName"]').type(testData.owner2.shopName);
    cy.get('button[type="submit"]').click();

    cy.get('.error-message').should('be.visible');
    cy.get('.error-message').should('contain', 'email');
  });

  it('should handle rejection workflow', () => {
    // This test would require admin functionality for rejecting users
    // Implementation depends on admin interface being available
    cy.log('Rejection workflow test would go here when admin interface is complete');
  });
});