import { Configurations, Analytics, Accordion } from "@/components";

export const Admin = () => {
  return (
    <>
      <div className="container items-center justify-start">
        <p className="mb-2">
          Here you can configure the scavenger hunt and view analytics. Click on one of the links below to get started!
        </p>
        <div className="mb-2 mt-6">
          <Configurations />
        </div>
        <Accordion title="Analytics">
          <Analytics />
        </Accordion>
      </div>
    </>
  );
};

export default Admin;
