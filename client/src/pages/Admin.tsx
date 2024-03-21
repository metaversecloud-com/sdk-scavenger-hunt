import Header from "@/components/Header";
import Configurations from "@/components/Configurations";
import Analytics from "@/components/Analytics";

export const Admin = () => {
  return (
    <div className="container p-6">
      <Header activeTab="admin" />
      <div className="flex flex-col w-full items-start mb-6 mt-6">
        <p className="mb-2">
          Here you can configure the scavenger hunt and view analytics. Click on
          one of the links below to get started!
        </p>
      </div>
      <hr />
      <br />

      <section className="accordion card">
        <div className="accordion-container">
          <details className="accordion-item">
            <summary className="accordion-trigger flex">
              <span className="accordion-title h4 flex-1">Configurations</span>
              <img className="accordion-icon flex-2" aria-hidden="true" src="https://sdk-style.s3.amazonaws.com/icons/chevronDown.svg" />
            </summary>
            <div className="accordion-content mt-5">
              <Configurations />
            </div>
          </details>
        </div>
      </section>

      <br />

      <section className="accordion card">
        <div className="accordion-container">
          <details className="accordion-item">
            <summary className="accordion-trigger flex">
              <span className="accordion-title h4 flex-1">Analytics</span>
              <img className="accordion-icon flex-2" aria-hidden="true" src="https://sdk-style.s3.amazonaws.com/icons/chevronDown.svg" />
            </summary>
            <div className="accordion-content mt-5">
              <Analytics />
            </div>
          </details>
        </div>
      </section>
    </div>
  );
};

export default Admin;
