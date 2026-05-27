import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ CONSOLE ERROR:', msg.text());
    }
  });

  console.log('🚀 Loading app...');
  await page.goto('http://127.0.0.1:8765/');
  await page.waitForTimeout(2000);

  // Take initial screenshot
  await page.screenshot({ path: 'screenshot-1-initial.png', fullPage: true });
  console.log('📸 Screenshot saved: screenshot-1-initial.png');

  // BUG TEST #1: Check if onboarding appears
  console.log('\n🧪 TEST #1: Onboarding on fresh account');
  const onboardingVisible = await page.isVisible('#onboardingOverlay');
  console.log(`Onboarding overlay visible: ${onboardingVisible}`);

  if (onboardingVisible) {
    console.log('✅ Onboarding is showing (expected for new account)');
    // Skip onboarding
    const skipBtn = await page.$('text=Omitir');
    if (skipBtn) {
      await skipBtn.click();
      await page.waitForTimeout(1000);
    }
  } else {
    console.log('⚠️ Onboarding NOT showing (bug confirmed if this is first load)');
  }

  await page.screenshot({ path: 'screenshot-2-after-onboarding.png', fullPage: true });

  // BUG TEST #2: Check period filter
  console.log('\n🧪 TEST #2: Period filter functionality');

  // Navigate to Gastos
  await page.click('text=Gastos');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshot-3-gastos.png', fullPage: true });

  // Check current period
  const currentPeriod = await page.evaluate(() => window._gTimePeriod);
  console.log(`Current period: ${currentPeriod}`);

  // Add a test expense
  console.log('Adding test expense...');
  await page.evaluate(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);
    const oldDate = lastYear.toISOString().split('T')[0];

    window.S.gastos.push({
      id: 'test-recent',
      concepto: 'TEST RECENT EXPENSE',
      importe: 100,
      categoria: 'Test',
      fecha: today,
      cuentaId: window.S.cuentas[0]?.id || 'c1'
    });

    window.S.gastos.push({
      id: 'test-old',
      concepto: 'TEST OLD EXPENSE',
      importe: 200,
      categoria: 'Test',
      fecha: oldDate,
      cuentaId: window.S.cuentas[0]?.id || 'c1'
    });

    window.renderGastos();
  });

  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshot-4-with-test-data.png', fullPage: true });

  // Count visible expenses
  const expensesVisible = await page.evaluate(() => {
    const rows = document.querySelectorAll('#gastosTable tbody tr');
    return Array.from(rows).map(r => r.textContent).filter(t => t.includes('TEST'));
  });
  console.log(`Visible TEST expenses with period='month': ${expensesVisible.length} (should be 1)`);
  console.log(`Expenses: ${JSON.stringify(expensesVisible)}`);

  // Switch to "Todo" period
  console.log('Switching to "Todo" period...');
  const todoBtn = await page.$('button.time-pill:has-text("Todo")');
  if (todoBtn) {
    await todoBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshot-5-todo-period.png', fullPage: true });

    const newPeriod = await page.evaluate(() => window._gTimePeriod);
    console.log(`Period after click: ${newPeriod}`);

    const expensesVisibleAll = await page.evaluate(() => {
      const rows = document.querySelectorAll('#gastosTable tbody tr');
      return Array.from(rows).map(r => r.textContent).filter(t => t.includes('TEST'));
    });
    console.log(`Visible TEST expenses with period='all': ${expensesVisibleAll.length} (should be 2)`);

    if (expensesVisibleAll.length === 2) {
      console.log('✅ Period filter is working correctly!');
    } else {
      console.log('❌ Period filter NOT working - still showing filtered results');
    }
  } else {
    console.log('❌ "Todo" button not found');
  }

  // BUG TEST #3: Navigate to Ingresos and test period filter
  console.log('\n🧪 TEST #3: Ingresos period filter');
  await page.click('text=Ingresos');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshot-6-ingresos.png', fullPage: true });

  // Add test income
  await page.evaluate(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);
    const oldDate = lastYear.toISOString().split('T')[0];

    window.S.ingresos.push({
      id: 'test-ing-recent',
      concepto: 'TEST RECENT INCOME',
      importe: 1000,
      categoria: 'Test',
      fecha: today,
      cuentaId: window.S.cuentas[0]?.id || 'c1',
      status: 'received'
    });

    window.S.ingresos.push({
      id: 'test-ing-old',
      concepto: 'TEST OLD INCOME',
      importe: 2000,
      categoria: 'Test',
      fecha: oldDate,
      cuentaId: window.S.cuentas[0]?.id || 'c1',
      status: 'received'
    });

    window._gTimePeriod = 'month';
    window.renderIngresos();
  });

  await page.waitForTimeout(500);

  const incomeVisibleMonth = await page.evaluate(() => {
    const rows = document.querySelectorAll('#ingresosTable tbody tr');
    return Array.from(rows).map(r => r.textContent).filter(t => t.includes('TEST'));
  });
  console.log(`Visible TEST incomes with period='month': ${incomeVisibleMonth.length} (should be 1)`);

  // Switch to Todo
  const todoBtnIncome = await page.$('button.time-pill:has-text("Todo")');
  if (todoBtnIncome) {
    await todoBtnIncome.click();
    await page.waitForTimeout(500);

    const incomeVisibleAll = await page.evaluate(() => {
      const rows = document.querySelectorAll('#ingresosTable tbody tr');
      return Array.from(rows).map(r => r.textContent).filter(t => t.includes('TEST'));
    });
    console.log(`Visible TEST incomes with period='all': ${incomeVisibleAll.length} (should be 2)`);

    if (incomeVisibleAll.length === 2) {
      console.log('✅ Ingresos period filter is working!');
    } else {
      console.log('❌ Ingresos period filter NOT working');
    }
  }

  await page.screenshot({ path: 'screenshot-7-ingresos-all.png', fullPage: true });

  console.log('\n📊 SUMMARY:');
  console.log('Check screenshots and console output above for details.');
  console.log('Press Ctrl+C to exit...');

  // Keep browser open for manual inspection
  await page.waitForTimeout(30000);

  await browser.close();
})();
