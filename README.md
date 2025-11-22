# IPAM Architect 🌐

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen?style=for-the-badge&logo=vercel)](https://cidr.botesnetworks.co.za)
![License](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)
![Built With](https://img.shields.io/badge/built%20with-Next.js%2016-black?style=for-the-badge)

> **Try the live application here: [cidr.botesnetworks.co.za](https://cidr.botesnetworks.co.za)**

**A modern, hierarchical IPv4 subnet calculator designed for Network Architects and Engineers.**

Stop calculating subnets in Excel. IPAM Architect automates the design of global network allocations, ensuring zero overlap while accounting for regional growth and standardization constraints.

![App Screenshot](https://cidr.botesnetworks.co.za/screenshot2.png)

## 🚀 Key Features

*   **Hierarchical Allocation:** Automatically divides a Supernet (e.g., `10.0.0.0/8`) down to Regions, Territories, and individual Sites.
*   **Zero-Overlap Math:** Built-in logic ensures that no two regions or sites ever share address space.
*   **Capacity Planning:** Visualize utilization percentages based on your site requirements. See exactly when you'll run out of IPs.
*   **Weighted Distribution:** Allocating more space to high-growth regions (e.g., give "North America" 2x the capacity of "Europe") using a simple slider interface.
*   **VLAN Standardization:** Define standard templates (e.g., "Every site gets 5 VLANs") and visualize the exact CIDR blocks for a standard site.
*   **Interactive Visualization:** Explore your network tree with a collapsible hierarchy view.
*   **JSON Export:** Copy your entire allocation structure to clipboard for use in documentation or automation scripts.
*   **Dark Mode:** Fully supported modern UI with glassmorphism aesthetics.

## 🛠️ Technology Stack

*   **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **UI Components:** [Shadcn/ui](https://ui.shadcn.com/) (Radix Primitives)
*   **Icons:** Lucide React
*   **Logic:** Custom recursive CIDR math library

## 🏁 Getting Started

### Prerequisites

*   Node.js 20.9 or later
*   TypeScript 5.1 or later
*   React 19.2 or later
*   npm, pnpm, or yarn

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/barendbotes/ipam-architect.git
    cd ipam-architect
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    pnpm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000) with your browser to start designing.

## 📖 How It Works

IPAM Architect breaks network design into three steps:

### 1. Configuration
Input your constraints:
*   **Supernet:** The root block (e.g., `10.0.0.0/8`).
*   **Topology:** How many regions? How many sites per region?
*   **Site Standard:** How many VLANs does a site need? What is the standard size (e.g., `/24`)?
*   **Biasing:** Adjust sliders to reserve more IP space for specific regions.

### 2. Analysis
The engine calculates the most efficient way to carve the supernet.
*   View the **Site Prefix** recommendation (e.g., "Each site needs a `/21` to fit your VLANs").
*   Check **Utilization** to ensure you aren't wasting space or running out of room.
*   See a visual breakdown of space distribution.

### 3. Hierarchy Map
Drill down into the generated data.
*   Expand Regions to see specific Subnets.
*   See the **First Site** and **Last Site** ranges for every territory to verify spacing.

## 🤝 Contributing

Contributions are welcome! This tool is designed to help the network engineering community.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 🔮 Future Roadmap

We are actively working on features to bridge the gap between planning and documentation:

*   **Site Schema Lookup:** A search tool where you can input a specific Site ID (e.g., `ORI-T1-S045`) and instantly generate the exact VLAN IP schema for that specific location.
*   **Dynamic Documentation Variables:** The ability to export Site IDs and VLAN ranges as variable blocks compatible with Markdown or Jinja2. This allows you to drop them directly into technical documentation or config templates.
*   **Profile Management:** (Planned) User accounts to create, save, and version-control network design profiles.
*   **Config Template Builder:** (Planned) Use your saved profiles to generate vendor-specific CLI configurations (Cisco, Juniper, Arista) based on your defined standard.

---

Built with ❤️ for Network Engineers.