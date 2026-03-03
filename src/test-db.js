import supabase from "./supabase-client.js"

async function testQuery() {
    console.log("Checking for supplier tenders...")
    const { data, error, count } = await supabase
        .from('tenders')
        .select('*', { count: 'exact' })
        .eq('tender_type', 'supplier')

    if (error) {
        console.error("Error:", error)
    } else {
        console.log("Count of supplier tenders:", count)
        console.log("Data snippet:", data?.slice(0, 2))
    }

    console.log("\nChecking for ALL tenders...")
    const { data: allData, count: allCount } = await supabase
        .from('tenders')
        .select('*', { count: 'exact' })

    console.log("Total tenders available to current context:", allCount)
}

testQuery()
