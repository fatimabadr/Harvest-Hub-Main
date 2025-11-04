import { NextResponse } from 'next/server';
import { query } from '@/lib/db';


export async function mockGetFarmPackages(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const farmId = searchParams.get('farmId');

    if (!farmId) {
      return NextResponse.json(
        { error: "Farm ID is required" },
        { status: 400 }
      );
    }

    
    const farmResult = await query(
      'SELECT COUNT(*) AS count FROM test_subscription.farms WHERE farm_id = $1',
      [farmId]
    );

    if (parseInt(farmResult.rows[0].count, 10) === 0) {
      return NextResponse.json(
        { error: "Farm not found" },
        { status: 404 }
      );
    }

    
    const packagesResult = await query(`
      SELECT 
        package_id as id,
        package_name as name,
        description,
        retail_value as "retailValue",
        plan_type as "planType",
        created_at as "createdAt",
        tags,
        items,
        farm_id as "farmId"
      FROM test_subscription.premade_packages
      WHERE farm_id = $1
      ORDER BY created_at DESC
    `, [farmId]);

    
    const transformedPackages = packagesResult.rows.map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      description: pkg.description,
      retailValue: Number(pkg.retailValue),
      itemCount: Array.isArray(pkg.items) ? pkg.items.length : 0,
      planType: pkg.planType,
      createdAt: pkg.createdAt,
      tags: pkg.tags || [],
      items: pkg.items || [],
      farmId: pkg.farmId,
      farmName: 'Test Farm',
      farmDescription: 'A test farm description',
      farmLocation: 'Test Farm Location'
    }));

    return NextResponse.json(transformedPackages);
  } catch (error) {
    console.error('Error fetching farm packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}


export async function mockCreatePackage(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      farmId,
      description,
      retailValue,
      items,
      tags,
      planType
    } = body;

    
    if (!name || !farmId || !description || !retailValue || !planType) {
      return NextResponse.json({
        error: 'Missing required fields',
        details: {
          name: !name ? 'Name is required' : null,
          farmId: !farmId ? 'Farm ID is required' : null,
          description: !description ? 'Description is required' : null,
          retailValue: !retailValue ? 'Retail value is required' : null,
          planType: !planType ? 'Plan type is required' : null
        }
      }, { status: 400 });
    }

    
    const farmResult = await query(
      'SELECT COUNT(*) AS count FROM test_subscription.farms WHERE farm_id = $1',
      [farmId]
    );

    if (parseInt(farmResult.rows[0].count, 10) === 0) {
      return NextResponse.json({
        error: 'Farm not found',
        requiresValidFarm: true
      }, { status: 404 });
    }

    
    const processedItems = items ? items.map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price
    })) : [];

    
    const packageResult = await query(
      `INSERT INTO test_subscription.premade_packages (
        package_name,
        farm_id,
        description,
        retail_value,
        plan_type,
        items,
        tags,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING package_id`,
      [
        name,
        farmId,
        description,
        retailValue,
        planType,
        JSON.stringify(processedItems),
        JSON.stringify(tags || [])
      ]
    );

    const packageId = packageResult.rows[0].package_id;

    return NextResponse.json({
      success: true,
      message: 'Package created successfully',
      packageId
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating package:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to create package'
    }, { status: 500 });
  }
}


export async function mockDeletePackage(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const packageId = searchParams.get('packageId');

    if (!packageId) {
      return NextResponse.json(
        { error: "Package ID is required" },
        { status: 400 }
      );
    }

    
    const packageResult = await query(
      'SELECT COUNT(*) AS count FROM test_subscription.premade_packages WHERE package_id = $1',
      [packageId]
    );

    if (parseInt(packageResult.rows[0].count, 10) === 0) {
      return NextResponse.json(
        { error: "Package not found" },
        { status: 404 }
      );
    }

    
    await query(
      'DELETE FROM test_subscription.premade_packages WHERE package_id = $1',
      [packageId]
    );

    return NextResponse.json({
      success: true,
      message: 'Package deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting package:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to delete package'
    }, { status: 500 });
  }
} 