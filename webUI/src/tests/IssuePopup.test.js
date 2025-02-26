import {
  act,
  cleanup,
  queryByTestId,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import IssuePopup from "../components/issueView/IssuePopup.jsx";
import AttachmentUploader from "../components/issueView/AttachmentUploader.jsx";
import axios from "axios";

jest.mock("axios");

window.alert = jest.fn();

// Checking if the IssuePopup component renders properly
describe("IssuePopup Component", () => {
  beforeEach(() => {
    axios.get.mockImplementation((url) => {
      if (url.slice(-8) === "issues/1") {
        return Promise.resolve({
          data: {
            assignee: "",
            description: "some desc",
            estimate: "3",
            id: 1,
            priority: "HIGH",
            reporter: "Athul Krishna",
            status: "To Do",
            ticketName: "Ticket One",
            title: "Title Here",
          },
        });
      }

      if (url.slice(-8) === "/comment") {
        return Promise.resolve({
          data: [
            { id: 687, text: "hello " },
            { id: 584, text: "hi\n" },
            { id: 179, text: "those" },
          ],
        });
      }

      if (url.slice(-8) === "/members") {
        return Promise.resolve({
          data: [
            { id: 1, name: "Athul Krishna" },
            { id: 2, name: "Test User 1" },
            { id: 3, name: "Test User 2" },
          ],
        });
      }
    });

    // to test description change
    axios.patch.mockImplementation((url) => {
      if (url.slice(-8) === "issues/1") {
        return Promise.resolve({
          data: {
            assignee: "Athul Krishna",
            description: "new desc",
            estimate: "10",
            id: 1,
            priority: "HIGH",
            reporter: "Athul Krishna",
            status: "To Do",
            ticketName: "Ticket One",
            title: "Title Here",
          },
        });
      }
    });
  });

  it("renders properly", async () => {
    render(<IssuePopup issueId={1} onClose={() => {}} />);
    expect(await screen.findByTestId("issue-details")).toBeInTheDocument();
    // screen.debug(undefined, Infinity);
    expect(screen.getByTestId("issue-details")).toBeInTheDocument();
  });

  it("can toggle between show/hide details", async () => {
    render(<IssuePopup issueId={1} onClose={() => {}} />);
    // wait till the Loading... is completed
    expect(
      await screen.findByTestId("show-hide-details-button")
    ).toBeInTheDocument();
    // click on the Show Details button
    userEvent.click(screen.getByTestId("show-hide-details-button"));
    // details section must be visible now
    expect(await screen.findByTestId("details-content")).toBeInTheDocument();
  });

  it("can update the estimate number", async () => {
    render(
      <IssuePopup issueId={1} onClose={() => {}} refreshBoard={() => {}} />
    );
    // wait till the Loading... is completed
    expect(
      await screen.findByTestId("show-hide-details-button")
    ).toBeInTheDocument();
    // click on the Show Details button
    userEvent.click(screen.getByTestId("show-hide-details-button"));
    // details section must be visible now
    expect(await screen.findByTestId("details-content")).toBeInTheDocument();
    // click on the span element to reveal the input field
    fireEvent.click(screen.getByTestId("sprint-number-span"));
    const sprintInput = screen.getByDisplayValue("3");
    // change the value in the input field
    fireEvent.change(sprintInput, { target: { value: "10" } });
    // click outside the input to trigger api call
    fireEvent.blur(sprintInput, { target: { value: "10" } });
    expect(screen.getByTestId("sprint-number-span").textContent).toBe("10");
  });

  it("shows correct status in Status dropdown", async () => {
    render(<IssuePopup issueId={1} onClose={() => {}} />);
    // wait till the Loading... is completed
    expect(
      await screen.findByTestId("show-hide-details-button")
    ).toBeInTheDocument();
    // check that there is a div with the text as "To Do"
    expect(screen.getByText("To Do", { selector: "div" })).toBeInTheDocument();
  });

  it("shows and update the description", async () => {
    render(<IssuePopup issueId={1} onClose={() => {}} />);
    // wait till the Loading... is completed
    let descTA;
    expect(
      (descTA = await screen.findByTestId("description-ta"))
    ).toBeInTheDocument();
    // check that the text in the description text area is "some desc"
    expect(descTA.value).toBe("some desc");
    const user = userEvent.setup();
    // now clear the text area and add the text "new desc" to it
    await act(async () => {
      await user.clear(descTA);
      await user.type(descTA, "new desc");
    });
    // click on the save button
    userEvent.click(screen.getByTestId("edit-description-button"));
    // check if api call went through and description was changed
    expect(descTA.value).toBe("new desc");
  });

  it("allows user to add a file as attachment", async () => {
    // dummy file to test upload
    const file = new File(["-test-dummy-image-contents-"], "testImage.png", {
      type: "image/png",
    });
    // mock createObjectURL function
    global.URL.createObjectURL = jest.fn();
    render(<IssuePopup issueId={1} onClose={() => {}} />);
    // wait till the Loading... is completed
    let attachmentFI;
    expect(
      (attachmentFI = await screen.findByTestId("fileInput"))
    ).toBeInTheDocument();
    // simulate uploading the image using the file input
    // await waitFor(() =>
     await  fireEvent.change(attachmentFI, {
        target: { files: [file] },
      })
    // );
    // now the attachment-container should be present in the document
    expect(
      await screen.findByTestId("attachments-container")
    ).toBeInTheDocument();
  });
});
