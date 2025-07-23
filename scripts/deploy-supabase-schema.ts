#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deploySchema() {
  try {
    console.log('🚀 Starting Supabase schema deployment...');
    console.log('📍 URL:', supabaseUrl);
    console.log('🔑 Service key:', supabaseServiceKey.substring(0, 20) + '...');
    
    // Read the SQL schema file
    const schemaPath = join(process.cwd(), 'supabase-complete-schema.sql');
    const schemaSql = readFileSync(schemaPath, 'utf8');
    
    console.log('📄 Schema file loaded:', schemaPath);
    console.log('📊 Schema size:', (schemaSql.length / 1024).toFixed(1) + 'KB');
    
    // Split the SQL into individual statements
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log('🔧 Found', statements.length, 'SQL statements to execute');
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.length === 0) continue;
      
      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        // Use RPC to execute raw SQL
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_statement: statement + ';'
        });
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          console.error('   Statement:', statement.substring(0, 100) + '...');
          errorCount++;
          
          // Continue with non-critical errors
          if (!error.message.includes('already exists')) {
            throw error;
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          successCount++;
        }
        
        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`💥 Fatal error in statement ${i + 1}:`, error);
        console.error('   Statement:', statement.substring(0, 100) + '...');
        errorCount++;
        
        // Ask user if they want to continue
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        const answer = await new Promise<string>(resolve => {
          readline.question('Continue with deployment? (y/n): ', resolve);
        });
        
        readline.close();
        
        if (answer.toLowerCase() !== 'y') {
          throw new Error('Deployment cancelled by user');
        }
      }
    }
    
    console.log('\n🎉 Schema deployment completed!');
    console.log('✅ Successful statements:', successCount);
    console.log('❌ Failed statements:', errorCount);
    console.log('📊 Success rate:', ((successCount / statements.length) * 100).toFixed(1) + '%');
    
    // Verify deployment by checking if key tables exist
    console.log('\n🔍 Verifying deployment...');
    
    const tables = [
      'customers',
      'stripe_customers', 
      'orders',
      'order_items',
      'contact_submissions',
      'user_sessions',
      'page_views',
      'events',
      'cart_sessions',
      'daily_metrics'
    ];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table '${table}' not accessible:`, error.message);
        } else {
          console.log(`✅ Table '${table}' verified`);
        }
      } catch (error) {
        console.log(`❌ Table '${table}' verification failed:`, error);
      }
    }
    
    console.log('\n🎯 Next steps:');
    console.log('1. Update your application to use the new Supabase service layer');
    console.log('2. Remove Redis KV-Store dependencies');
    console.log('3. Test all functionality with the new database schema');
    console.log('4. Monitor performance and optimize queries as needed');
    
  } catch (error) {
    console.error('💥 Schema deployment failed:', error);
    process.exit(1);
  }
}

// Alternative method using direct SQL execution
async function deploySchemaAlternative() {
  try {
    console.log('🚀 Starting alternative deployment method...');
    
    const schemaPath = join(process.cwd(), 'supabase-complete-schema.sql');
    const schemaSql = readFileSync(schemaPath, 'utf8');
    
    // Try to execute the entire schema at once
    const { data, error } = await supabase
      .from('_temp_schema_deployment')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('📝 Note: Direct SQL execution not available through client.');
      console.log('🔧 Please use one of these methods instead:');
      console.log('');
      console.log('METHOD 1: Supabase CLI');
      console.log('supabase db push --local');
      console.log('');
      console.log('METHOD 2: Dashboard SQL Editor');
      console.log('1. Go to Supabase Dashboard → SQL Editor');
      console.log('2. Copy and paste the schema from supabase-complete-schema.sql');
      console.log('3. Execute the SQL statements');
      console.log('');
      console.log('METHOD 3: Manual table creation');
      console.log('Use the Supabase Dashboard table editor to create tables manually');
    }
    
  } catch (error) {
    console.error('Alternative deployment method failed:', error);
  }
}

// Main execution
if (require.main === module) {
  deploySchema().catch(error => {
    console.error('Deployment failed:', error);
    console.log('\n🔄 Trying alternative deployment method...');
    deploySchemaAlternative();
  });
}

export { deploySchema, deploySchemaAlternative }; 