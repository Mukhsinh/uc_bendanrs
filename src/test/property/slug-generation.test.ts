/**
 * Property-Based Tests untuk Slug Generation
 * Feature: tenant-user-management-ui
 * 
 * Test ini menggunakan fast-check untuk property-based testing
 * dengan minimum 100 iterations per property.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateSlugFromName } from '@/services/tenantOnboarding';

describe('Slug Generation Property Tests', () => {
  /**
   * Feature: tenant-user-management-ui, Property 16: Slug Auto-generation Correctness
   * Validates: Requirements 12.3
   * 
   * Property: For any tenant name entered, the auto-generated slug should be in 
   * kebab-case format and contain only lowercase letters, numbers, and hyphens
   */
  it('Property 16: Slug Auto-generation Correctness - should generate valid kebab-case slug', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generator untuk tenant names dengan berbagai karakter
        fc.string({ minLength: 1, maxLength: 100 }),
        async (tenantName) => {
          // Skip empty strings setelah trim
          if (tenantName.trim().length === 0) {
            return true;
          }

          // Generate slug dari name
          const slug = generateSlugFromName(tenantName);

          // Property 1: Slug harus lowercase
          expect(slug).toBe(slug.toLowerCase());

          // Property 2: Slug hanya boleh mengandung a-z, 0-9, dan hyphens
          expect(slug).toMatch(/^[a-z0-9-]*$/);

          // Property 3: Slug tidak boleh mengandung spasi
          expect(slug).not.toContain(' ');

          // Property 4: Slug tidak boleh mengandung karakter special (kecuali hyphen)
          expect(slug).not.toMatch(/[^a-z0-9-]/);

          // Property 5: Slug tidak boleh memiliki multiple consecutive hyphens
          expect(slug).not.toMatch(/--+/);

          // Property 6: Slug maksimal 50 karakter
          expect(slug.length).toBeLessThanOrEqual(50);

          return true;
        }
      ),
      { numRuns: 100 } // Run 100 iterations
    );
  });

  /**
   * Property: Slug generation should be deterministic
   * Same input should always produce same output
   */
  it('Property: Slug generation is deterministic', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (tenantName) => {
          if (tenantName.trim().length === 0) {
            return true;
          }

          const slug1 = generateSlugFromName(tenantName);
          const slug2 = generateSlugFromName(tenantName);

          // Same input should produce same output
          expect(slug1).toBe(slug2);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Slug should handle special characters correctly
   */
  it('Property: Slug removes special characters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          base: fc.string({ minLength: 1, maxLength: 20 }),
          special: fc.constantFrom('!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '=', '+', '[', ']', '{', '}', '|', '\\', '/', '?', '<', '>', ',', '.', ';', ':', '"', "'")
        }),
        async ({ base, special }) => {
          const nameWithSpecial = `${base}${special}${base}`;
          const slug = generateSlugFromName(nameWithSpecial);

          // Slug should not contain the special character
          expect(slug).not.toContain(special);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Slug should convert spaces to hyphens
   */
  it('Property: Slug converts spaces to hyphens', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.string({ minLength: 1, maxLength: 10 }), { minLength: 2, maxLength: 5 }),
        async (words) => {
          const nameWithSpaces = words.join(' ');
          const slug = generateSlugFromName(nameWithSpaces);

          // Slug should not contain spaces
          expect(slug).not.toContain(' ');

          // If original had spaces, slug should have hyphens (unless filtered out)
          if (nameWithSpaces.includes(' ') && slug.length > 0) {
            // Slug should be kebab-case
            expect(slug).toMatch(/^[a-z0-9-]+$/);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Slug should handle uppercase correctly
   */
  it('Property: Slug converts uppercase to lowercase', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => /[A-Z]/.test(s)),
        async (nameWithUppercase) => {
          const slug = generateSlugFromName(nameWithUppercase);

          // Slug should be all lowercase
          expect(slug).toBe(slug.toLowerCase());

          // Slug should not contain any uppercase letters
          expect(slug).not.toMatch(/[A-Z]/);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
