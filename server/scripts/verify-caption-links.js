/**
 * Verification Script: Verify Caption-Content Item Links
 * 
 * This script verifies that all captions are correctly linked to their content items
 * by checking the drive_file_id relationship.
 * 
 * Usage: node server/scripts/verify-caption-links.js [driveFileId]
 */

const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  ssl: process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1' 
    ? { rejectUnauthorized: false } 
    : false,
});

async function verifyCaptionLinks(driveFileId = null) {
  try {
    console.log('🔍 Verifying caption-content item links...\n');

    let query;
    let params = [];

    if (driveFileId) {
      // Verify specific file
      query = `
        SELECT 
          ci.id as content_item_id,
          ci.drive_file_id,
          ci.filename,
          ci.file_type,
          COUNT(cap.id) as caption_count,
          ARRAY_AGG(
            json_build_object(
              'id', cap.id,
              'tone', cap.tone,
              'content', LEFT(cap.content, 50) || '...',
              'status', cap.status,
              'created_at', cap.created_at
            )
          ) as captions
        FROM content_items ci
        LEFT JOIN captions cap ON ci.id = cap.content_item_id
        WHERE ci.drive_file_id = $1
        GROUP BY ci.id, ci.drive_file_id, ci.filename, ci.file_type
        ORDER BY ci.created_at DESC
      `;
      params = [driveFileId];
      console.log(`Checking specific file: ${driveFileId}\n`);
    } else {
      // Verify all files
      query = `
        SELECT 
          ci.id as content_item_id,
          ci.drive_file_id,
          ci.filename,
          ci.file_type,
          COUNT(cap.id) as caption_count,
          ARRAY_AGG(
            json_build_object(
              'id', cap.id,
              'tone', cap.tone,
              'status', cap.status,
              'created_at', cap.created_at
            )
          ) FILTER (WHERE cap.id IS NOT NULL) as captions
        FROM content_items ci
        LEFT JOIN captions cap ON ci.id = cap.content_item_id
        GROUP BY ci.id, ci.drive_file_id, ci.filename, ci.file_type
        ORDER BY ci.created_at DESC
      `;
      console.log('Checking all content items...\n');
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      console.log('❌ No content items found');
      if (driveFileId) {
        console.log(`   Drive File ID: ${driveFileId}`);
      }
      return;
    }

    console.log(`Found ${result.rows.length} content item(s):\n`);
    console.log('='.repeat(80));

    let totalIssues = 0;

    for (const row of result.rows) {
      console.log(`\n📁 Content Item:`);
      console.log(`   ID: ${row.content_item_id}`);
      console.log(`   Drive File ID: ${row.drive_file_id}`);
      console.log(`   Filename: ${row.filename}`);
      console.log(`   File Type: ${row.file_type}`);
      console.log(`   Caption Count: ${row.caption_count}`);

      // Verify captions
      if (row.caption_count > 0 && row.captions) {
        console.log(`\n   📝 Captions:`);
        for (const caption of row.captions) {
          // Verify the caption is actually linked to this content item
          const verifyResult = await pool.query(
            `SELECT content_item_id FROM captions WHERE id = $1`,
            [caption.id]
          );
          
          if (verifyResult.rows.length === 0) {
            console.log(`      ❌ Caption ${caption.id} - NOT FOUND IN DATABASE`);
            totalIssues++;
          } else if (verifyResult.rows[0].content_item_id !== row.content_item_id) {
            console.log(`      ❌ Caption ${caption.id} - MISMATCH! Linked to different content item`);
            console.log(`         Expected: ${row.content_item_id}`);
            console.log(`         Actual: ${verifyResult.rows[0].content_item_id}`);
            totalIssues++;
          } else {
            console.log(`      ✅ Caption ${caption.id} - ${caption.tone} (${caption.status})`);
          }
        }
      } else {
        console.log(`   ⚠️  No captions found for this content item`);
      }

      console.log('-'.repeat(80));
    }

    // Check for orphaned captions (captions without valid content items)
    console.log(`\n🔍 Checking for orphaned captions...\n`);
    const orphanedQuery = `
      SELECT cap.id, cap.content_item_id, cap.tone, cap.status, cap.created_at
      FROM captions cap
      LEFT JOIN content_items ci ON cap.content_item_id = ci.id
      WHERE ci.id IS NULL
    `;
    const orphanedResult = await pool.query(orphanedQuery);

    if (orphanedResult.rows.length > 0) {
      console.log(`❌ Found ${orphanedResult.rows.length} orphaned caption(s):`);
      for (const orphan of orphanedResult.rows) {
        console.log(`   - Caption ${orphan.id} (tone: ${orphan.tone}, status: ${orphan.status})`);
        console.log(`     Linked to non-existent content_item_id: ${orphan.content_item_id}`);
        totalIssues++;
      }
    } else {
      console.log(`✅ No orphaned captions found`);
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    if (totalIssues === 0) {
      console.log('✅ VERIFICATION PASSED: All caption-content item links are correct!');
    } else {
      console.log(`❌ VERIFICATION FAILED: Found ${totalIssues} issue(s)`);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error during verification:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run verification
const driveFileId = process.argv[2] || null;
verifyCaptionLinks(driveFileId);

