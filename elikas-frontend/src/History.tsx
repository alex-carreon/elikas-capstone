import { Link } from "react-router";
import ButtonComp from "@/components/Button";

function History() {
  return (
    <div className="mt-13">
      History
      <Link to="/EvacForm" state={{ from: location.pathname }}>
        <ButtonComp
          variant="primary"
          text="See Pin"
          id="History_PinDetailsBtn"
        ></ButtonComp>
      </Link>
    </div>
  );
}

export default History;
