import { aptos } from "@/utils/aptosClient";

// Simple test to check if contract is accessible
export const testContract = async () => {
  try {
    console.log("Testing contract access...");
    console.log("Module address:", import.meta.env.VITE_MODULE_ADDRESS);
    
    // Test 1: Try to call get_max_supply directly
    console.log("Attempting to call get_max_supply...");
    const result = await aptos.view({
      payload: {
        function: `${import.meta.env.VITE_MODULE_ADDRESS}::retro_nft_generator_da::get_max_supply`,
        functionArguments: [],
      },
    });
    
    console.log("get_max_supply result:", result);
    return result;
    
  } catch (error) {
    console.error("Contract test failed:", error);
    
    // Test 2: Check if the module exists at all
    try {
      console.log("Checking if module exists...");
      const accountResource = await aptos.getAccountResource({
        accountAddress: import.meta.env.VITE_MODULE_ADDRESS,
        resourceType: "0x1::code::PackageRegistry"
      });
      console.log("Module exists:", accountResource);
    } catch (moduleError) {
      console.error("Module doesn't exist:", moduleError);
    }
    
    throw error;
  }
};