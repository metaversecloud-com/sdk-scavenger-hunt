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

      <section id="accordion" className="accordion">
        <div className="accordion-container">
          <details className="accordion-item">
            <summary className="accordion-trigger">
              <h3>Configurations</h3>
              <span className="accordion-icon" aria-hidden="true">
                &#8897;
              </span>
            </summary>
            <div className="accordion-content">
              <Configurations />
            </div>
          </details>
        </div>
      </section>

      <section id="accordion" className="accordion">
        <div className="accordion-container">
          <details className="accordion-item">
            <summary className="accordion-trigger">
              <h3>Analytics</h3>
              <span className="accordion-icon" aria-hidden="true">
                &#8897;
              </span>
            </summary>
            <div className="accordion-content">
              <Analytics />
            </div>
          </details>
        </div>
      </section>
    </div>
  );
};

export default Admin;
