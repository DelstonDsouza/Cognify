import { useState, useEffect } from "react";
import { Phone, Plus, Trash2, User, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Contact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
}

export function EmergencyContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    relationship: "",
    phone: "",
  });

  useEffect(() => {
    const stored = localStorage.getItem("emergencyContacts");
    if (stored) {
      setContacts(JSON.parse(stored));
    }
  }, []);

  const saveContacts = (newContacts: Contact[]) => {
    localStorage.setItem("emergencyContacts", JSON.stringify(newContacts));
    setContacts(newContacts);
  };

  const addContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name || !newContact.phone) {
      toast.error("Please fill in name and phone number");
      return;
    }

    const contact: Contact = {
      id: Date.now().toString(),
      ...newContact,
      isPrimary: contacts.length === 0,
    };

    saveContacts([...contacts, contact]);
    setNewContact({ name: "", relationship: "", phone: "" });
    setShowAddForm(false);
    toast.success("Emergency contact added!");
  };

  const deleteContact = (id: string) => {
    saveContacts(contacts.filter((contact) => contact.id !== id));
    toast.success("Contact removed");
  };

  const setPrimary = (id: string) => {
    const updated = contacts.map((contact) => ({
      ...contact,
      isPrimary: contact.id === id,
    }));
    saveContacts(updated);
    toast.success("Primary contact updated");
  };

  const callContact = (phone: string, name: string) => {
    toast.success(`Calling ${name}...`);
    // In a real app, this would trigger a phone call
    window.open(`tel:${phone}`, "_self");
  };

  const callEmergency = () => {
    toast.error("Calling Emergency Services (911)...");
    // In a real app, this would trigger emergency call
    window.open("tel:911", "_self");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 flex items-center gap-3">
          <Phone className="w-10 h-10 text-red-500" />
          Emergency Contacts
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-6 py-3 bg-red-500 text-white rounded-lg text-lg font-semibold hover:bg-red-600 transition-colors flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-6 h-6" />
          Add Contact
        </button>
      </div>

      {/* Emergency SOS Button */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg p-8 text-center">
        <AlertCircle className="w-16 h-16 text-white mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-4">
          Emergency Assistance
        </h3>
        <button
          onClick={callEmergency}
          className="px-12 py-6 bg-white text-red-600 rounded-xl text-2xl font-bold hover:bg-red-50 transition-all transform hover:scale-105 shadow-xl"
        >
          <Phone className="w-8 h-8 inline mr-3" />
          CALL 911
        </button>
        <p className="text-white mt-4 text-lg opacity-90">
          Press this button in case of immediate emergency
        </p>
      </div>

      {/* Add Contact Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            Add Emergency Contact
          </h3>
          <form onSubmit={addContact} className="space-y-4">
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={newContact.name}
                onChange={(e) =>
                  setNewContact({ ...newContact, name: e.target.value })
                }
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                placeholder="e.g., John Doe"
                required
              />
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Relationship
              </label>
              <input
                type="text"
                value={newContact.relationship}
                onChange={(e) =>
                  setNewContact({ ...newContact, relationship: e.target.value })
                }
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                placeholder="e.g., Son, Daughter, Friend"
              />
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={newContact.phone}
                onChange={(e) =>
                  setNewContact({ ...newContact, phone: e.target.value })
                }
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
                placeholder="e.g., (555) 123-4567"
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg text-lg font-semibold hover:bg-red-600 transition-colors"
              >
                Add Contact
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg text-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Contacts List */}
      <div className="space-y-4">
        {contacts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <User className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500 mb-4">
              No emergency contacts added yet
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-red-500 text-white rounded-lg text-lg font-semibold hover:bg-red-600 transition-colors"
            >
              Add Your First Contact
            </button>
          </div>
        ) : (
          contacts.map((contact) => (
            <div
              key={contact.id}
              className={`bg-white rounded-xl shadow-lg p-6 ${
                contact.isPrimary ? "border-2 border-red-500" : ""
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-2xl font-bold text-gray-800">
                      {contact.name}
                    </h3>
                    {contact.isPrimary && (
                      <span className="px-3 py-1 bg-red-500 text-white text-sm font-semibold rounded-full">
                        PRIMARY
                      </span>
                    )}
                  </div>
                  {contact.relationship && (
                    <p className="text-lg text-gray-600 mb-2">
                      {contact.relationship}
                    </p>
                  )}
                  <p className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    {contact.phone}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => callContact(contact.phone, contact.name)}
                    className="px-6 py-3 bg-green-500 text-white rounded-lg text-lg font-semibold hover:bg-green-600 transition-colors flex items-center gap-2"
                  >
                    <Phone className="w-6 h-6" />
                    Call
                  </button>
                  {!contact.isPrimary && (
                    <button
                      onClick={() => setPrimary(contact.id)}
                      className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-lg font-semibold"
                    >
                      Set Primary
                    </button>
                  )}
                  <button
                    onClick={() => deleteContact(contact.id)}
                    className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    aria-label="Delete contact"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Safety Tips */}
      <div className="bg-blue-50 rounded-xl shadow-lg p-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <AlertCircle className="w-7 h-7 text-blue-500" />
          Safety Tips
        </h3>
        <ul className="space-y-2 text-lg text-gray-700">
          <li>• Keep your phone charged at all times</li>
          <li>• Add at least 2-3 trusted emergency contacts</li>
          <li>• Make sure your contacts know they are listed</li>
          <li>• Test emergency calls periodically</li>
          <li>• Keep important medical information accessible</li>
        </ul>
      </div>
    </div>
  );
}
